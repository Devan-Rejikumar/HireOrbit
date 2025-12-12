import { injectable, inject } from 'inversify';
import { Transaction, SubscriptionPlan } from '@prisma/client';
import Stripe from 'stripe';
import TYPES from '../../config/types';
import { ITransactionRepository } from '../../repositories/interfaces/ITransactionRepository';
import { ISubscriptionPlanRepository } from '../../repositories/interfaces/ISubscriptionPlanRepository';
import { ISubscriptionRepository } from '../../repositories/interfaces/ISubscriptionRepository';
import { IStripeService } from '../interfaces/IStripeService';
import { IRevenueService, RevenueStatistics, TransactionHistoryResponse } from '../interfaces/IRevenueService';

@injectable()
export class RevenueService implements IRevenueService {
  constructor(
    @inject(TYPES.ITransactionRepository)
    private readonly _transactionRepository: ITransactionRepository,
    @inject(TYPES.ISubscriptionPlanRepository)
    private readonly _planRepository: ISubscriptionPlanRepository,
    @inject(TYPES.ISubscriptionRepository)
    private readonly _subscriptionRepository: ISubscriptionRepository,
    @inject(TYPES.IStripeService)
    private readonly _stripeService: IStripeService,
  ) {}

  async getRevenueStatistics(startDate?: Date, endDate?: Date, userType?: 'user' | 'company'): Promise<RevenueStatistics> {
    const filters = startDate || endDate || userType ? { startDate, endDate, userType } : undefined;

    const [totalRevenue, revenueByPlan, revenueByTimePeriod] = await Promise.all([
      this._transactionRepository.getTotalRevenue(filters),
      this._transactionRepository.getRevenueByPlan(filters),
      startDate && endDate
        ? this._transactionRepository.getRevenueByTimePeriod(startDate, endDate, 'day', userType)
        : Promise.resolve([]),
    ]);

    // Calculate revenueByUserType from revenueByPlan (more reliable than checking userId/companyId)
    const revenueByUserType = {
      user: 0,
      company: 0,
    };
    
    revenueByPlan.forEach(planRevenue => {
      if (planRevenue.userType === 'user') {
        revenueByUserType.user += planRevenue.revenue;
      } else if (planRevenue.userType === 'company') {
        revenueByUserType.company += planRevenue.revenue;
      }
    });

    return {
      totalRevenue,
      revenueByUserType,
      revenueByPlan,
      revenueByTimePeriod,
    };
  }

  async getTransactionHistory(filters?: {
    userId?: string;
    companyId?: string;
    planId?: string;
    status?: string;
    userType?: 'user' | 'company';
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<TransactionHistoryResponse> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this._transactionRepository.findMany({
        userId: filters?.userId,
        companyId: filters?.companyId,
        planId: filters?.planId,
        status: filters?.status,
        userType: filters?.userType,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        limit,
        offset,
      }),
      this._transactionRepository.count({
        userId: filters?.userId,
        companyId: filters?.companyId,
        planId: filters?.planId,
        status: filters?.status,
        userType: filters?.userType,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      }),
    ]);

    const planIds: string[] = [...new Set(transactions.map((t: Transaction) => t.planId))];
    const plans: (SubscriptionPlan | null)[] = await Promise.all(
      planIds.map((id: string) => this._planRepository.findById(id)),
    );
    const planMap = new Map<string, SubscriptionPlan>(
      plans.filter((p: SubscriptionPlan | null): p is SubscriptionPlan => p !== null).map((p: SubscriptionPlan) => [p.id, p]),
    );

    const transactionHistory = transactions.map((transaction: Transaction) => {
      const plan = planMap.get(transaction.planId);
      return {
        id: transaction.id,
        subscriptionId: transaction.subscriptionId || undefined,
        userId: transaction.userId || undefined,
        companyId: transaction.companyId || undefined,
        planId: transaction.planId,
        planName: plan?.name || 'Unknown Plan',
        userType: plan?.userType || 'unknown',
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        billingPeriod: transaction.billingPeriod,
        paymentDate: transaction.paymentDate,
        stripeInvoiceId: transaction.stripeInvoiceId || undefined,
      };
    });

    return {
      transactions: transactionHistory,
      total,
      page,
      limit,
    };
  }

  async syncTransactionsFromStripe(limit: number = 100): Promise<{ synced: number; skipped: number; errors: number }> {
    let synced = 0;
    let skipped = 0;
    let errors = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    console.log('Starting transaction sync from Stripe', { limit });

    while (hasMore) {
      try {
        console.log('Fetching invoices from Stripe', { limit, startingAfter });
        const invoices = await this._stripeService.listInvoices(limit, startingAfter);
        console.log(`Fetched ${invoices.data.length} invoices from Stripe`, {
          total: invoices.data.length,
          hasMore: invoices.has_more,
          statuses: invoices.data.map((inv: Stripe.Invoice) => ({ id: inv.id, status: inv.status })),
        });
        
        for (const invoice of invoices.data) {
          try {
            const invoiceDataForLog = invoice as unknown as { subscription?: string | Stripe.Subscription | null };
            console.log('Processing invoice', { 
              invoiceId: invoice.id, 
              status: invoice.status,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              hasSubscription: !!invoiceDataForLog.subscription,
            });
   
            if (invoice.id) {
              const existing = await this._transactionRepository.findByStripeInvoiceId(invoice.id);
              if (existing) {
                console.log('Transaction already exists, skipping', { invoiceId: invoice.id });
                skipped++;
                continue;
              }
            }
       
            if (invoice.status !== 'paid') {
              console.log('Skipping invoice - not paid', { invoiceId: invoice.id, status: invoice.status });
              skipped++;
              continue;
            }
           
            const invoiceData = invoice as unknown as {
              subscription?: string | Stripe.Subscription | null;
              payment_intent?: string | Stripe.PaymentIntent | null;
              amount_paid?: number;
              currency?: string;
              metadata?: Record<string, string>;
              customer?: string | Stripe.Customer;
              lines?: {
                data?: Array<{
                  price?: {
                    id?: string;
                    recurring?: {
                      interval?: string;
                    };
                  };
                }>;
              };
            };
            
            const subscriptionId = invoiceData.subscription
              ? (typeof invoiceData.subscription === 'string' ? invoiceData.subscription : invoiceData.subscription.id)
              : null;

            let subscription = null;
            let userId: string | undefined;
            let companyId: string | undefined;
            let planId: string | undefined;
            let billingPeriod: string = 'monthly';
           
            if (invoiceData.metadata?.userId && invoiceData.metadata.userId !== '') {
              userId = invoiceData.metadata.userId;
              console.log('Found userId from invoice metadata (initial)', { invoiceId: invoice.id, userId });
            }
            if (invoiceData.metadata?.companyId && invoiceData.metadata.companyId !== '') {
              companyId = invoiceData.metadata.companyId;
              console.log('Found companyId from invoice metadata (initial)', { invoiceId: invoice.id, companyId });
            }
            
            if ((!userId && !companyId) && invoiceData.customer) {
              try {
                const customerId = typeof invoiceData.customer === 'string' 
                  ? invoiceData.customer 
                  : invoiceData.customer.id;
                console.log('Retrieving customer to get metadata (initial)', { customerId });
                const customer = await this._stripeService.getCustomer(customerId);
                if (customer.metadata) {
                  if (customer.metadata.userId && customer.metadata.userId !== '') {
                    userId = customer.metadata.userId;
                    console.log('Found userId from customer metadata (initial)', { customerId, userId });
                  }
                  if (customer.metadata.companyId && customer.metadata.companyId !== '') {
                    companyId = customer.metadata.companyId;
                    console.log('Found companyId from customer metadata (initial)', { customerId, companyId });
                  }
                }
              } catch (error: unknown) {
                const err = error as { message?: string };
                console.error('Failed to retrieve customer for metadata (initial)', { error: err.message, invoiceId: invoice.id });
              }
            }

            if (subscriptionId) {
              console.log('Looking for subscription in database', { subscriptionId });
              subscription = await this._subscriptionRepository.findByStripeSubscriptionId(subscriptionId);
              if (subscription) {
                userId = subscription.userId || undefined;
                companyId = subscription.companyId || undefined;
                planId = subscription.planId;
                billingPeriod = subscription.billingPeriod;
                console.log('Found subscription in database', { subscriptionId, planId, userId, companyId });
              } else {
                console.log('Subscription not found in database', { subscriptionId });
              }
            } else {
              console.log('Invoice has no subscription', { invoiceId: invoice.id });
            }
    
            let priceId: string | undefined;
       
            if (invoiceData.lines?.data?.[0]?.price) {
              const price = invoiceData.lines.data[0].price;
              priceId = typeof price === 'string' ? price : price.id;
            }
     
            if (!priceId && invoice.id) {
              try {
                console.log('Retrieving full invoice to get price ID', { invoiceId: invoice.id });
                const fullInvoice = await this._stripeService.getInvoice(invoice.id);
      
                const fullInvoiceForLog = fullInvoice as unknown as {
                  payment_intent?: string | Stripe.PaymentIntent;
                };
                console.log('Full invoice structure', {
                  invoiceId: invoice.id,
                  lines: fullInvoice.lines?.data?.map((line) => {
                    const lineData = line as { price?: string | { id?: string }; amount?: number; description?: string };
                    return {
                      price: lineData.price,
                      priceId: typeof lineData.price === 'string' ? lineData.price : lineData.price?.id,
                      amount: lineData.amount,
                      description: lineData.description,
                    };
                  }),
                  metadata: fullInvoice.metadata,
                  payment_intent: fullInvoiceForLog.payment_intent,
                });
                
                const fullInvoiceData = fullInvoice as unknown as {
                  lines?: {
                    data?: Array<{
                      price?: string | {
                        id?: string;
                        recurring?: {
                          interval?: string;
                        };
                      };
                    }>;
                  };
                  metadata?: Record<string, string>;
                  payment_intent?: string | Stripe.PaymentIntent;
                };
           
                if (fullInvoiceData.lines?.data?.[0]?.price) {
                  const price = fullInvoiceData.lines.data[0].price;
                  priceId = typeof price === 'string' ? price : price.id;
                  console.log('Found price ID from full invoice lines', { invoiceId: invoice.id, priceId });
                }
               
                if (!priceId && fullInvoiceData.metadata?.planId) {
                  planId = fullInvoiceData.metadata.planId;
                  console.log('Found planId from invoice metadata', { invoiceId: invoice.id, planId });
                }
               
                if (fullInvoiceData.metadata?.userId && fullInvoiceData.metadata.userId !== '') {
                  userId = fullInvoiceData.metadata.userId;
                  console.log('Found userId from invoice metadata', { invoiceId: invoice.id, userId });
                }
                if (fullInvoiceData.metadata?.companyId && fullInvoiceData.metadata.companyId !== '') {
                  companyId = fullInvoiceData.metadata.companyId;
                  console.log('Found companyId from invoice metadata', { invoiceId: invoice.id, companyId });
                }
                
                if ((!userId && !companyId) && fullInvoice.customer) {
                  try {
                    const customerId = typeof fullInvoice.customer === 'string' 
                      ? fullInvoice.customer 
                      : fullInvoice.customer.id;
                    console.log('Retrieving customer to get metadata', { customerId });
                    const customer = await this._stripeService.getCustomer(customerId);
                    if (customer.metadata) {
                      if (customer.metadata.userId && customer.metadata.userId !== '') {
                        userId = customer.metadata.userId;
                        console.log('Found userId from customer metadata', { customerId, userId });
                      }
                      if (customer.metadata.companyId && customer.metadata.companyId !== '') {
                        companyId = customer.metadata.companyId;
                        console.log('Found companyId from customer metadata', { customerId, companyId });
                      }
                    }
                  } catch (error: unknown) {
                    const err = error as { message?: string };
                    console.error('Failed to retrieve customer for metadata', { error: err.message, invoiceId: invoice.id });
                  }
                }
            
                if (!planId && invoice.amount_paid) {
                  const amountInRupees = invoice.amount_paid / 100;
                  console.log('Trying to match plan by amount', { invoiceId: invoice.id, amount: amountInRupees });
                  const allPlans = await this._planRepository.findAll();
                  const matchingPlan = allPlans.find(plan => 
                    (plan.priceMonthly && Math.abs(plan.priceMonthly - amountInRupees) < 0.01) || 
                    (plan.priceYearly && Math.abs(plan.priceYearly - amountInRupees) < 0.01),
                  );
                  if (matchingPlan) {
                    planId = matchingPlan.id;
                    billingPeriod = (matchingPlan.priceMonthly && Math.abs(matchingPlan.priceMonthly - amountInRupees) < 0.01) ? 'monthly' : 'yearly';
                    console.log('Found matching plan by amount', { planId, planName: matchingPlan.name, billingPeriod, amount: amountInRupees });
                  } else {
                    console.warn('No plan found matching amount', {
                      invoiceId: invoice.id,
                      amount: amountInRupees,
                      availablePlans: allPlans.map(p => ({
                        id: p.id,
                        name: p.name,
                        monthlyPrice: p.priceMonthly,
                        yearlyPrice: p.priceYearly,
                      })),
                    });
              
                    const invoiceLine = fullInvoice.lines?.data?.[0];
                    const invoiceDescription = invoiceLine?.description || '';
                    console.log('Trying to match plan by description', { invoiceId: invoice.id, description: invoiceDescription });
                    
                    const planNameMatch = invoiceDescription.match(/(?:Company|User)\s+(\w+)\s+Plan/i);
                    if (planNameMatch) {
                      const extractedPlanName = planNameMatch[1]; // "Basic", "Premium", etc.
                      const userType = invoiceDescription.toLowerCase().includes('company') ? 'company' : 'user';
                      
                      console.log('Extracted plan info from description', { 
                        invoiceId: invoice.id,
                        planName: extractedPlanName,
                        userType, 
                      });
                    
                      const planByName = allPlans.find(plan => 
                        plan.name.toLowerCase() === extractedPlanName.toLowerCase() && 
                        plan.userType === userType,
                      );
                      
                      if (planByName) {
                        planId = planByName.id;
                  
                        billingPeriod = invoiceDescription.toLowerCase().includes('/ month') ? 'monthly' : 
                          invoiceDescription.toLowerCase().includes('/ year') ? 'yearly' : 'monthly';
                        console.log(' Found matching plan by description', { 
                          planId, 
                          planName: planByName.name, 
                          userType: planByName.userType,
                          billingPeriod,
                          originalAmount: amountInRupees,
                          currentPlanPrice: planByName.priceMonthly || planByName.priceYearly,
                        });
                      } else {
                        console.warn('Plan not found by name and userType', {
                          invoiceId: invoice.id,
                          extractedPlanName,
                          userType,
                          availablePlans: allPlans.map(p => ({ name: p.name, userType: p.userType })),
                        });
                      }
                    }
                  }
                }
              } catch (error: unknown) {
                const err = error as { message?: string };
                console.error('Failed to retrieve full invoice', { error: err.message, invoiceId: invoice.id });
              }
            }
            
            if (priceId) {
              console.log('Looking for plan by price ID', { invoiceId: invoice.id, priceId });
              const allPlans = await this._planRepository.findAll();
              console.log(`Found ${allPlans.length} plans in database`);
              const matchingPlan = allPlans.find(
                plan => plan.stripePriceIdMonthly === priceId || plan.stripePriceIdYearly === priceId,
              );
              if (matchingPlan) {
                planId = matchingPlan.id;
                billingPeriod = matchingPlan.stripePriceIdMonthly === priceId ? 'monthly' : 'yearly';
                console.log('Found matching plan', { planId, planName: matchingPlan.name, billingPeriod });
              } else {
                console.warn('No matching plan found for price ID', { 
                  invoiceId: invoice.id, 
                  priceId,
                  availablePlans: allPlans.map(p => ({ 
                    id: p.id, 
                    name: p.name, 
                    monthlyPriceId: p.stripePriceIdMonthly,
                    yearlyPriceId: p.stripePriceIdYearly, 
                  })),
                });
              }
            } else {
              console.warn('No price ID found in invoice', { 
                invoiceId: invoice.id,
                hasLines: !!invoiceData.lines,
                linesCount: invoiceData.lines?.data?.length || 0,
              });
            }

            if (!planId) {
              console.warn('Cannot create transaction: plan not found', { 
                invoiceId: invoice.id,
                subscriptionId,
                hasPriceId: !!invoiceData.lines?.data?.[0]?.price?.id,
                priceId: invoiceData.lines?.data?.[0]?.price?.id,
              });
              skipped++;
              continue;
            }
      
            const amountPaid = invoiceData.amount_paid || 0;
            const amount = amountPaid / 100;
            const paymentIntentId = invoiceData.payment_intent
              ? (typeof invoiceData.payment_intent === 'string' ? invoiceData.payment_intent : invoiceData.payment_intent.id)
              : undefined;
           
            const invoiceObj = invoice as unknown as { created?: number; status_transitions?: { paid_at?: number } };
            const paymentDate = invoiceObj.status_transitions?.paid_at
              ? new Date(invoiceObj.status_transitions.paid_at * 1000)
              : (invoiceObj.created ? new Date(invoiceObj.created * 1000) : new Date());

            const status = invoice.status === 'paid' ? 'succeeded' : 'failed';
            await this._transactionRepository.create({
              subscriptionId: subscription?.id,
              userId,
              companyId,
              planId,
              amount,
              currency: invoiceData.currency?.toLowerCase() || 'inr',
              status,
              stripeInvoiceId: invoice.id,
              stripePaymentIntentId: paymentIntentId,
              billingPeriod,
              paymentDate,
            });

            synced++;
            console.log('Transaction synced from Stripe', { invoiceId: invoice.id, amount, status });
          } catch (error: unknown) {
            const err = error as { message?: string };
            console.error('Failed to sync transaction from invoice', {
              error: err.message || error,
              invoiceId: invoice.id,
            });
            errors++;
          }
        }

        hasMore = invoices.has_more;
        if (invoices.data.length > 0) {
          startingAfter = invoices.data[invoices.data.length - 1].id;
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error('Failed to fetch invoices from Stripe', { error: err.message || error });
        errors++;
        hasMore = false;
      }
    }

    return { synced, skipped, errors };
  }
}

