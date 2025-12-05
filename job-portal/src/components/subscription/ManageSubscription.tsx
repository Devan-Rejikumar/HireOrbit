import { useEffect, useState } from 'react';
import { subscriptionService, SubscriptionStatusResponse, SubscriptionPlan } from '../../api/subscriptionService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../ConfirmationModal';

export const ManageSubscription = () => {
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const statusResponse = await subscriptionService.getSubscriptionStatus();
      setStatus(statusResponse.data);
      
      // Load plans with correct userType
      const userType = statusResponse.data.plan?.userType || 'user';
      const plansRes = await subscriptionService.getPlans(userType);
      setAvailablePlans(plansRes.data);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(error.response?.data?.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancel = async () => {
    if (!status?.subscription) return;

    try {
      setProcessing(true);
      setShowCancelConfirm(false);
      await subscriptionService.cancelSubscription(status.subscription.id);
      toast.success('Subscription cancelled successfully');
      loadData();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpgrade = async (newPlanId: string) => {
    if (!status?.subscription) return;

    try {
      setProcessing(true);
      await subscriptionService.upgradeSubscription(status.subscription.id, newPlanId);
      toast.success('Subscription upgraded successfully');
      loadData();
    } catch (error: any) {
      console.error('Error upgrading subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to upgrade subscription');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!status || !status.subscription) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">No active subscription found.</p>
          <button
            onClick={() => navigate('/subscriptions')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

  const currentPlan = status.subscription.plan;
  const upgradePlans = availablePlans.filter(plan => {
    // Simple comparison - in production, you'd compare plan tiers
    return plan.id !== currentPlan.id && 
           (plan.priceMonthly !== null || plan.priceYearly !== null);
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Subscription</h2>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Current Plan: {currentPlan.name}</h3>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">Status: <span className="font-semibold capitalize">{status.subscription.status}</span></p>
          <p className="text-gray-600 mb-2">
            Billing Period: <span className="font-semibold capitalize">{status.subscription.billingPeriod}</span>
          </p>
          <p className="text-gray-600">
            Next billing date: {new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        </div>

        {!status.subscription.cancelAtPeriodEnd && (
          <button
            onClick={handleCancelClick}
            disabled={processing}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            {processing ? 'Processing...' : 'Cancel Subscription'}
          </button>
        )}

        {status.subscription.cancelAtPeriodEnd && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Your subscription is scheduled to be cancelled at the end of the current billing period.
            </p>
          </div>
        )}
      </div>

      {upgradePlans.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Upgrade Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upgradePlans.map((plan) => {
              const formatPrice = (price: number | null | undefined) => {
                if (price === null || price === undefined || typeof price !== 'number') {
                  return 'Free';
                }
                return `₹${price.toLocaleString('en-IN')}/month`;
              };

              return (
                <div key={plan.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{plan.name}</h4>
                  <p className="text-gray-600 mb-4">
                    {formatPrice(plan.priceMonthly)}
                  </p>
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={processing}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {processing ? 'Processing...' : 'Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period. You will lose access to premium features after the current period ends."
        confirmText="Yes, Cancel Subscription"
        cancelText="Keep Subscription"
        loadingText="Cancelling..."
        type="warning"
        loading={processing}
      />
    </div>
  );
};

