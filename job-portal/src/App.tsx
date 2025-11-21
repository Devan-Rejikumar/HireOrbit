import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { NotificationProvider } from './context/NotificationContext';
import { GlobalChatProvider } from './context/GlobalChatContext';
import { useAuth } from './context/AuthContext';
import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';
import CompanyProtectedRoute from './components/CompanyProtectedRoute';
import AdminAuthProtected from './components/AdminAuthProtected';

// Keep critical routes non-lazy for faster initial load
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Index from './pages/Index';
import JobListings from './pages/JobListings';
import JobDetails from './pages/JobDetails';
import Companies from './pages/Companies';
import NotFound from './pages/404Page';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

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
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route path="/login" element={<ProtectedRoute redirectIfAuthenticated={true}><LoginPage /></ProtectedRoute>} />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <PublicRoute>
              <Index />
            </PublicRoute>
          }
        />
        <Route
          path="/company/dashboard"
          element={
            <CompanyProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <CompanyDashboard />
              </Suspense>
            </CompanyProtectedRoute>
          }
        />
        <Route path="/admin/register" element={<AdminAuthProtected><Suspense fallback={<LoadingFallback />}><AdminAuth /></Suspense></AdminAuthProtected>} />
        <Route path="/admin/login" element={<AdminAuthProtected><Suspense fallback={<LoadingFallback />}><AdminAuth /></Suspense></AdminAuthProtected>} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/profile" element={
          <Suspense fallback={<LoadingFallback />}>
            <UserProfile />
          </Suspense>
        } />
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <UserDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/applied-jobs"
          element={
            <ProtectedRoute requireAuth allowedRoles={['jobseeker']}>
              <Suspense fallback={<LoadingFallback />}>
                <AppliedJobsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/profile-setup"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CompanyProfileSetup />
            </Suspense>
          }
        />
        <Route
          path="/company/review-status"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CompanyReviewStatus />
            </Suspense>
          }
        />
        <Route path="/company/post-job" element={
          <Suspense fallback={<LoadingFallback />}>
            <PostJob />
          </Suspense>
        } />
        <Route path="/company/jobs" element={<CompanyProtectedRoute><Suspense fallback={<LoadingFallback />}><CompanyJobListing /></Suspense></CompanyProtectedRoute>} />
        <Route path="/company/settings" element={<CompanyProtectedRoute><Suspense fallback={<LoadingFallback />}><CompanySettings /></Suspense></CompanyProtectedRoute>} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/company/applications" element={<CompanyProtectedRoute><Suspense fallback={<LoadingFallback />}><CompanyApplications /></Suspense></CompanyProtectedRoute>} />
        <Route path="/company/interviews" element={<CompanyProtectedRoute><Suspense fallback={<LoadingFallback />}><CompanyInterviewManagement /></Suspense></CompanyProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute requireAuth allowedRoles={['jobseeker']}><Suspense fallback={<LoadingFallback />}><MySchedule /></Suspense></ProtectedRoute>} />
        <Route
          path="/messages"
          element={
            <ProtectedRoute requireAuth allowedRoles={['jobseeker']}>
              <Suspense fallback={<LoadingFallback />}>
                <MessagesPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/chat" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><Chat /></Suspense></ProtectedRoute>} />
        <Route path="/blocked" element={<Suspense fallback={<LoadingFallback />}><BlockedUser /></Suspense>} />
        
        {/* Test route for notifications */}
        <Route path="/notification-test" element={<Suspense fallback={<LoadingFallback />}><NotificationTest /></Suspense>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <Router>
      <AppWithNotifications />
      <ToastContainer />
    </Router>
  );
}

export default App;