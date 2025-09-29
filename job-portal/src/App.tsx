import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Index from './pages/Index';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminAuth from './components/AdminAuth';
import AdminDashboard from './pages/AdminDashboard';
import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/LoginForm';
import CompanyProtectedRoute from './components/CompanyProtectedRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import JobListings from './pages/JobListings';
import UserProfile from './pages/UserProfile';
import CompanyProfileSetup from './pages/CompanyProfileSetup';
import CompanyReviewStatus from './pages/CompanyReviewStatus';
import PostJob from './pages/PostJob';
import JobDetails from './pages/JobDetails';
import NotFound from './pages/404Page';
import CompanyApplications from './pages/CompanyApplications';
import CompanyJobListing from './pages/CompanyJobListing';
import CompanySettings from './pages/CompanySettings';

function App() {
  return (
    <Router>
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
        <Route path="/" element={<Index />} />
        <Route
          path="/company/dashboard"
          element={
            <CompanyProtectedRoute>
              <CompanyDashboard />
            </CompanyProtectedRoute>
          }
        />
        <Route path="/admin/register" element={<AdminAuth />} />
        <Route path="/admin/login" element={<AdminAuth />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route
          path="/company/profile-setup"
          element={<CompanyProfileSetup />}
        />
        <Route
          path="/company/review-status"
          element={<CompanyReviewStatus />}
        />
        <Route path="/company/post-job" element={<PostJob />} />
        <Route path="/company/jobs" element={<CompanyProtectedRoute><CompanyJobListing /></CompanyProtectedRoute>} />
        <Route path="/company/settings" element={<CompanyProtectedRoute><CompanySettings /></CompanyProtectedRoute>} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/company/applications" element={<CompanyApplications />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
