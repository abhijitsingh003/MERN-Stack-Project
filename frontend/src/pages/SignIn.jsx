import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import AuthLayout from '../components/AuthLayout';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        login(data, data.token);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div 
        className="perspective-1000"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          x.set(e.clientX - centerX);
          y.set(e.clientY - centerY);
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        <motion.div
          style={{ rotateX, rotateY }}
          className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden p-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-300">Sign in to your intelligent calendar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
               <motion.div 
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-center gap-3"
               >
                 <div className="w-2 h-2 rounded-full bg-red-500" />
                 <p className="text-sm text-red-200">{error}</p>
               </motion.div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
               <label className="flex items-center text-gray-300 cursor-pointer">
                 <input type="checkbox" className="mr-2 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500/50" />
                 Remember me
               </label>
               <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
              Sign up for free
            </Link>
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
};

export default SignIn;
