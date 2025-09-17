import React from 'react';
import ForgotPassword from '../components/ForgotPassword';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPasswordPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
    <ForgotPassword />
    <ToastContainer />
  </div>
);

export default ForgotPasswordPage;