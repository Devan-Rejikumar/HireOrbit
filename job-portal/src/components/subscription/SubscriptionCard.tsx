import { SubscriptionPlan, SubscriptionFeature } from '../../api/subscriptionService';
import { Check } from 'lucide-react';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  currentPlan?: string;
  onSelect: (planId: string, billingPeriod: 'monthly' | 'yearly') => void;
  userType: 'user' | 'company';
  isPopular?: boolean;
  billingPeriod: 'monthly' | 'yearly';
}

export const SubscriptionCard = ({ 
  plan, 
  currentPlan, 
  onSelect, 
  userType, 
  isPopular = false,
  billingPeriod 
}: SubscriptionCardProps) => {
  const isCurrentPlan = currentPlan === plan.id;
  const isFreePlan = plan.priceMonthly === null || plan.priceMonthly === undefined || plan.priceMonthly === 0;
  const hasYearly = plan.priceYearly !== null && plan.priceYearly !== undefined;

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || typeof price !== 'number') return 'Free';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const getPrice = () => {
    if (isFreePlan) return 'Free';
    // Always show monthly pricing
    return formatPrice(plan.priceMonthly);
  };

  const getPriceLabel = () => {
    if (isFreePlan) return '';
    return '/Monthly';
  };

  // Helper function to extract feature name (handles both string and SubscriptionFeature)
  const getFeatureName = (feature: string | SubscriptionFeature): string => {
    return typeof feature === 'string' ? feature : feature.name;
  };

  // Helper function to check if a feature exists in the features array
  const hasFeature = (featureName: string): boolean => {
    return plan.features.some(f => getFeatureName(f) === featureName);
  };

  const formatFeatureName = (feature: string) => {
    return feature
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Ats/g, 'ATS')
      .replace(/At/g, 'AT');
  };

  // Get display features - for User Premium, add implicit features
  const getDisplayFeatures = () => {
    if (userType === 'user' && plan.name.toLowerCase() === 'premium') {
      // For User Premium, show all three features
      // Add implicit features with special formatting
      return [
        'ATS Score Checker - Optimize your resume for job applications',
        'Increased Visibility - Your profile highlighted to recruiters',
        'Premium Badge - Shows Premium status on your profile'
      ];
    }
    
    // For other plans, format the actual features
    return plan.features.map(feature => {
      const featureName = getFeatureName(feature);
      const formatted = formatFeatureName(featureName);
      // Add descriptions for common features
      if (featureName === 'ats_checker') {
        return 'ATS Score Checker - Optimize your resume for job applications';
      }
      if (featureName === 'unlimited_jobs') {
        return 'Unlimited job postings';
      }
      if (featureName === 'featured_jobs') {
        return 'Featured job listings';
      }
      if (featureName === 'user_profile_search') {
        return 'User profile search';
      }
      if (featureName === 'company_ats_filter') {
        return 'ATS-filtered resumes';
      }
      if (featureName === 'enhanced_analytics') {
        return 'Enhanced analytics';
      }
      if (featureName === 'advanced_analytics') {
        return 'Advanced analytics';
      }
      return formatted;
    });
  };

  // Determine tagline based on plan name and user type
  const getTagline = () => {
    if (plan.name.toLowerCase() === 'free') {
      return userType === 'user' ? 'Perfect for getting started' : 'Perfect for getting started';
    } else if (plan.name.toLowerCase() === 'basic') {
      return 'Ideal for small businesses';
    } else if (plan.name.toLowerCase() === 'premium') {
      return userType === 'user' ? 'For professionals' : 'For fast-growing businesses';
    }
    return '';
  };

  return (
    <div className={`relative border rounded-lg p-6 h-full flex flex-col transition-all hover:shadow-lg ${
      isPopular 
        ? 'bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500 text-white shadow-xl scale-105' 
        : isCurrentPlan
        ? 'border-blue-500 bg-blue-50'
        : 'bg-white border-gray-200 hover:border-purple-300'
    }`}>
      {/* Most Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-xs font-bold">
            MOST POPULAR PLAN
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && !isPopular && (
        <div className="absolute -top-3 right-4">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Current Plan
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className={`text-2xl font-bold mb-1 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
          {plan.name}
        </h3>
        <p className={`text-sm ${isPopular ? 'text-purple-100' : 'text-gray-600'}`}>
          {getTagline()}
        </p>
      </div>

      <div className="mb-6">
        <div className={`text-4xl font-bold mb-1 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
          {getPrice()}
        </div>
        {!isFreePlan && (
          <div className={`text-sm ${isPopular ? 'text-purple-100' : 'text-gray-600'}`}>
            {getPriceLabel()}
          </div>
        )}
        {isFreePlan && (
          <div className={`text-sm ${isPopular ? 'text-purple-100' : 'text-gray-600'}`}>
            Forever free
          </div>
        )}
      </div>

      <ul className="mb-6 space-y-3 flex-1">
        {(() => {
          const displayFeatures = getDisplayFeatures();
          if (displayFeatures.length > 0) {
            return displayFeatures.map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className={`h-5 w-5 mr-2 flex-shrink-0 mt-0.5 ${
                  isPopular ? 'text-white' : 'text-green-500'
                }`} />
                <span className={`text-sm leading-relaxed ${isPopular ? 'text-purple-50' : 'text-gray-700'}`}>
                  {feature}
                </span>
              </li>
            ));
          }
          return (
            <li className={`text-sm ${isPopular ? 'text-purple-200' : 'text-gray-500'}`}>
              Basic features included
            </li>
          );
        })()}
      </ul>

      <div className="mt-auto">
        {isFreePlan ? (
          <div className={`text-center py-3 px-4 rounded-lg ${
            isPopular ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            Default Plan
          </div>
        ) : (
          <>
            <button
              onClick={() => onSelect(plan.id, 'monthly')}
              disabled={isCurrentPlan}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                isCurrentPlan
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : isPopular
                  ? 'bg-white text-purple-600 hover:bg-purple-50 shadow-md'
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
