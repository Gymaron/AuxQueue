import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuxCordLogo } from '../components/AuxCordLogo';
import { Mail, Lock } from 'lucide-react';
import { api } from '../services/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email.includes('@')) newErrors.email = 'Please enter a valid email address.';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (validateForm()) {
      try {
        const res = await api.login({ email, password });
        localStorage.setItem('userName', res.name);
        localStorage.setItem('userRole', res.role?.name || 'USER');
        navigate('/party/select');
      } catch (err: any) {
        setServerError(err.message || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AuxCordLogo className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-[#b3b3b3]">Sign in to continue to AuxQueue</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-[#181818] rounded-lg p-8 space-y-6">
          {serverError && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm text-center">
              {serverError}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={`w-full bg-[#282828] border ${errors.email ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-12 text-white placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                className={`w-full bg-[#282828] border ${errors.password ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-12 text-white placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-[#1DB954] text-black font-bold py-3 rounded-full hover:bg-[#1ed760] hover:scale-105 transition-all"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}