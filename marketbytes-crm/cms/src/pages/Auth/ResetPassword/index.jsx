import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../../../helpers/apiClient';
import bgAuth from '../../../assets/images/bg-auth.avif';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState('request_otp');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRequestOTP = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    apiClient
      .post('request-otp/', { email })
      .then((response) => {
        setMessage(response.data.message);
        setError('');
        setStep('reset_password');
      })
      .catch((error) => {
        setError(
          error.response?.data?.error || 'Failed to send OTP. Please try again.'
        );
      });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must be exactly 6 digits');
      return;
    }
    if (!email || !newPassword) {
      setError('Email and new password are required');
      return;
    }
    apiClient
      .post('reset-password/', { email, otp, new_password: newPassword })
      .then((response) => {
        setMessage(response.data.message);
        setError('');
        setTimeout(() => navigate('/login'), 2000);
      })
      .catch((error) => {
        setError(
          error.response?.data?.error ||
          'Failed to reset password. Please try again.'
        );
      });
  };

  return (
    <motion.div
      className="min-h-screen bg-white flex items-center justify-end p-6"
      style={{
        backgroundImage: `url(${bgAuth})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-white bg-opacity-95 p-8 rounded-lg shadow-lg w-full max-w-xl border border-gray-200"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,245,245,1) 100%)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="flex flex-col justify-center items-center mb-6">
          <h3 className="text-2xl font-semibold text-black mb-2">
            Reset Your Password
          </h3>
          <p className="text-gray-600 text-center text-sm">
            Enter your email to receive an OTP, then set your new password securely.
          </p>
        </div>
        <h2 className="text-3xl font-bold mb-6 text-center text-black">
          {step === 'request_otp' ? 'Request OTP' : 'Reset Password'}
        </h2>
        {error && (
          <motion.p
            className="text-red-600 mb-4 text-center font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}
        {message && (
          <motion.p
            className="text-green-600 mb-4 text-center font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {message}
          </motion.p>
        )}
        {step === 'request_otp' ? (
          <div className="space-y-6 divide-y divide-gray-200">
            <div className="pt-6">
              <InputField
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="pt-4">
              <Button
                onClick={handleRequestOTP}
                className="bg-black text-white hover:bg-black/80"
              >
                Send OTP
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 divide-y divide-gray-200">
            <div className="pt-6">
              <InputField
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                pattern="\d*"
                title="OTP must be 6 digits"
              />
            </div>
            <div className="pt-4">
              <InputField
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="pt-4">
              <Button
                onClick={handleResetPassword}
                className="bg-black text-white hover:bg-black/80"
              >
                Reset Password
              </Button>
            </div>
          </div>
        )}
        <div className="pt-8">
          <Button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-black bg-transparent border border-gray-200 hover:bg-gray-100"
          >
            Back to Login
          </Button>
        </div>
        <div className="mt-6 text-center text-sm text-gray-600">
          By continuing you agree to our{' '}
          <Link
            to="/cms/privacy-policy"
            className="text-black hover:underline font-medium"
          >
            privacy policy
          </Link>{' '}
          and{' '}
          <Link
            to="/cms/terms-and-conditions"
            className="text-black hover:underline font-medium"
          >
            terms and conditions
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResetPassword;