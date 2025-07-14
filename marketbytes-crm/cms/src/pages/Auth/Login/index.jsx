import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail } from 'lucide-react';
import apiClient from '../../../helpers/apiClient';
import bgAuth from '../../../assets/images/bg-auth.avif';
import InputField from '../../../components/InputField';
import Button from '../../../components/Button';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isAuthenticated');

    apiClient
      .post('login/', { email, password })
      .then((response) => {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        setIsAuthenticated(true);
        navigate('/');
      })
      .catch((error) => {
        setError(
          error.response?.data?.detail || 'Login failed. Please try again.'
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
        style={{ background: 'layer-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,245,245,1) 100%)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="flex flex-col justify-center items-center mb-6">
          <h3 className="text-2xl font-semibold text-black mb-2">
            Welcome Back!
          </h3>
          <p className="text-gray-600 text-center text-sm">
            Log in to access your profile and manage your account securely.
          </p>
        </div>
        <h2 className="text-3xl font-bold mb-6 text-center text-black">Login</h2>
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
            <InputField
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="pt-4">
            <Button
              onClick={handleLogin}
              className="bg-black text-white hover:bg-black/80 flex items-center justify-center"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          </div>
          <div className="pt-4">
            <Button
              onClick={() => navigate('/reset-password')}
              className="text-gray-600 hover:text-black bg-transparent border border-gray-200 hover:bg-gray-100"
            >
              Forgot Password?
            </Button>
          </div>
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

export default Login;