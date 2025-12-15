import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from './context/NotificationContext';
import { GlobalChatProvider } from './context/GlobalChatContext';
import { useAuth } from './context/AuthContext';
import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';
import CompanyProtectedRoute from './components/CompanyProtectedRoute';
import AdminAuthProtected from './components/AdminAuthProtected';
import { ROUTES } from './constants/routes';

// Keep critical routes non-lazy for faster initial load
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Index from './pages/Index';
import JobListings from './pages/JobListings';
import JobDetails from './pages/JobDetails';
import Companies from './pages/Companies';
import NotFound from './pages/404Page';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';

// Lazy load heavy/less-frequently-used routes
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard'));
const AdminAuth = lazy(() => import('./components/AdminAuth'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const CompanyProfileSetup = lazy(() => import('./pages/CompanyProfileSetup'));
const CompanyReviewStatus = lazy(() => import('./pages/CompanyReviewStatus'));
const PostJob = lazy(() => import('./pages/PostJob'));
const CompanyApplications = lazy(() => import('./pages/CompanyApplications'));
const CompanyJobListing = lazy(() => import('./pages/CompanyJobListing'));
const CompanySettings = lazy(() => import('./pages/CompanySettings'));
const CompanyInterviewManagement = lazy(() => import('./pages/CompanyInterviewManagement'));
const MySchedule = lazy(() => import('./pages/MySchedule'));
const AppliedJobsPage = lazy(() => import('./pages/AppliedJobsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const BlockedUser = lazy(() => import('./pages/BlockedUser'));
const Chat = lazy(() => import('./pages/Chat').then(module => ({ default: module.Chat })));
const NotificationTest = lazy(() => import('./pages/NotificationTest'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage').then(module => ({ default: module.SubscriptionPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(module => ({ default: module.CheckoutPage })));
const SubscriptionStatus = lazy(() => import('./components/subscription/SubscriptionStatus').then(module => ({ default: module.SubscriptionStatus })));
const ManageSubscription = lazy(() => import('./components/subscription/ManageSubscription').then(module => ({ default: module.ManageSubscription })));
const ATSScoreChecker = lazy(() => import('./pages/ATSScoreChecker'));
const InterviewVideoCall = lazy(() => import('./pages/InterviewVideoCall').then(module => ({ default: module.InterviewVideoCall })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Component to wrap routes with notification and chat context
const AppWithNotifications = () => {
  const { user, company, role } = useAuth();
  const recipientId = role === 'jobseeker' ? user?.id : company?.id;
  
  return (
    <GlobalChatProvider>
      <NotificationProvider recipientId={recipientId || ''}>
        <AppContent />
      </NotificationProvider>
    </GlobalChatProvider>
  );
};

// Main app content with routes
const AppContent = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route
          path={ROUTES.REGISTER}
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route path={ROUTES.LOGIN} element={<ProtectedRoute redirectIfAuthenticated={true}><LoginPage /></ProtectedRoute>} />
        <Route
          path={ROUTES.FORGOT_PASSWORD}
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path={ROUTES.HOME}
          element={
            <PublicRoute>
              <Index />
            </PublicRoute>
          }
        />
        <Route
          path={ROUTES.COMPANY_DASHBOARD}
          element={
            <CompanyProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <CompanyDashboard />
              </Suspense>
            </CompanyProtectedRoute>
          }
        />
        <Route path={ROUTES.ADMIN_REGISTER} element={<AdminAuthProtected><Suspense fallback={<LoadingFallback />}><AdminAuth /></Suspense></AdminAuthProtected>} />
        <Route path={ROUTES.ADMIN_LOGIN} element={<AdminAuthProtected><Suspense fallback={<LoadingFallback />}><AdminAuth /></Suspense></AdminAuthProtected>} />
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.JOBS} element={<JobListings />} />
        <Route path={ROUTES.COMPANIES} element={<Companies />} />
        <Route path={ROUTES.PROFILE} element={
          <Suspense fallback={<LoadingFallback />}>
            <UserProfile />
          </Suspense>
        } />
        <Route
          path={ROUTES.USER_DASHBOARD}
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <UserDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.APPLIED_JOBS}
          element={
            <ProtectedRoute requireAuth allowedRoles={['jobseeker']}>
              <Suspense fallback={<LoadingFallback />}>
                <AppliedJobsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.COMPANY_PROFILE_SETUP}
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CompanyProfileSetup />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.COMPANY_REVIEW_STATUS}
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CompanyReviewStatus />
            </Suspense>
          }
        />
        <Route path={ROUTES.COMPANY_POST_JOB} element={
          <Suspense fallback={<LoadingFallback />}>
            <PostJob />
          </Suspense>
        } />
        <Route path={ROUTES.COMPANY_JOBS} element={<CompanyProtectedRoute><Suspense fallback={<LoadingFallback />}><CompanyJobListing /></Suspense></CompanyProtectedRoute>} />
        <Route path={ROUTES.COMPANY_SETTINGS} element={<CompanyProtectedRoute><Suspense fallback={<LoadingFallback />}><CompanySettings /></Suspense></CompanyProtectedRoute>} />
        <Route path={ROUTES.JOB_DETAILS_PATTERN} element={<JobDetails />} />
        <Route path={ROUTES.COMPANY_APPLICATIONS} element={<CompanyProtectedRoute><Suspense fallback={<LoadingFallback />}><CompanyApplications /></Suspense></CompanyProtectedRoute>} />
        <Route path={ROUTES.COMPANY_INTERVIEWS} element={<CompanyProtectedRoute><Suspense fallback={<LoadingFallback />}><CompanyInterviewManagement /></Suspense></CompanyProtectedRoute>} />
        <Route path={ROUTES.INTERVIEW_VIDEO_PATTERN} element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><InterviewVideoCall /></Suspense></ProtectedRoute>} />
        <Route path={ROUTES.SCHEDULE} element={<ProtectedRoute requireAuth allowedRoles={['jobseeker']}><Suspense fallback={<LoadingFallback />}><MySchedule /></Suspense></ProtectedRoute>} />
        <Route
          path={ROUTES.MESSAGES}
          element={
            <ProtectedRoute requireAuth allowedRoles={['jobseeker']}>
              <Suspense fallback={<LoadingFallback />}>
                <MessagesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path={ROUTES.CHAT} element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Chat /></Suspense></ProtectedRoute>} />
        <Route path={ROUTES.BLOCKED} element={<Suspense fallback={<LoadingFallback />}><BlockedUser /></Suspense>} />
        
        {/* Public content pages */}
        <Route path={ROUTES.ABOUT} element={<PublicRoute><AboutPage /></PublicRoute>} />
        <Route path={ROUTES.HELP} element={<PublicRoute><HelpPage /></PublicRoute>} />
        
        {/* Subscription routes */}
        <Route path={ROUTES.SUBSCRIPTIONS} element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><SubscriptionPage /></Suspense></ProtectedRoute>} />
        <Route path={ROUTES.SUBSCRIPTIONS_CHECKOUT} element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><CheckoutPage /></Suspense></ProtectedRoute>} />
        <Route path={ROUTES.SUBSCRIPTIONS_STATUS} element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><SubscriptionStatus /></Suspense></ProtectedRoute>} />
        <Route path={ROUTES.SUBSCRIPTIONS_MANAGE} element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><ManageSubscription /></Suspense></ProtectedRoute>} />
        
        {/* Premium features */}
        <Route path={ROUTES.ATS_CHECKER} element={<ProtectedRoute requireAuth allowedRoles={['jobseeker']}><Suspense fallback={<LoadingFallback />}><ATSScoreChecker /></Suspense></ProtectedRoute>} />
        
        {/* Test route for notifications */}
        <Route path={ROUTES.NOTIFICATION_TEST} element={<Suspense fallback={<LoadingFallback />}><NotificationTest /></Suspense>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <Router>
      <AppWithNotifications />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;