import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subscriptionService, SubscriptionStatusResponse } from '../../api/subscriptionService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SubscriptionStatus = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewSubscription, setIsNewSubscription] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    // If session_id is present, it means payment was just completed
    if (sessionId) {
      setIsNewSubscription(true);
      toast.success('🎉 Payment successful! Your subscription is now active.');
    }
  }, [sessionId]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getSubscriptionStatus();
      setStatus(response.data);
      
      // If we have a session_id and subscription is active, it's a new subscription
      if (sessionId && response.data.isActive && response.data.subscription) {
        setIsNewSubscription(true);
        // Redirect to dashboard after 3 seconds to show success message
        setTimeout(() => {
          navigate(dashboardPath);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error loading subscription status:', error);
      toast.error(error.response?.data?.message || 'Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading subscription status...</div>
      </div>
    );
  }

  if (!status || !status.subscription) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">No Active Subscription</h3>
          <p className="text-gray-600 mb-4">You don't have an active subscription plan.</p>
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

  const subscription = status.subscription;
  const isActive = status.isActive;
  const dashboardPath = role === 'company' ? '/company/dashboard' : '/user/dashboard';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Success Banner for New Subscriptions */}
      {isNewSubscription && isActive && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-900 mb-2">
                🎉 Welcome to {subscription.plan.name}!
              </h3>
              <p className="text-green-800 mb-4">
                Your payment was successful and your subscription is now active. 
                You can start using all premium features immediately.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(dashboardPath)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/subscriptions')}
                  className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                >
                  View All Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Subscription Status</h2>
      
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold">{subscription.plan.name} Plan</h3>
              {isActive && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Active
                </span>
              )}
            </div>
            <p className="text-gray-600 capitalize">{subscription.billingPeriod} billing</p>
          </div>
          <div className={`px-4 py-2 rounded-full ${isActive ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className={`font-semibold ${isActive ? 'text-green-600' : 'text-red-600'} capitalize`}>
              {subscription.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Current Period Start</p>
            <p className="font-semibold">
              {new Date(subscription.currentPeriodStart).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Period End</p>
            <p className="font-semibold">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800">
              ⚠️ Your subscription will be cancelled at the end of the current billing period.
            </p>
          </div>
        )}

        <div className="mb-4">
          <h4 className="font-semibold mb-2">Active Features:</h4>
          <ul className="space-y-2">
            {status.features.length > 0 ? (
              status.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500">No premium features</li>
            )}
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/subscriptions/manage')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Manage Subscription
          </button>
          <button
            onClick={() => navigate('/subscriptions')}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
};

