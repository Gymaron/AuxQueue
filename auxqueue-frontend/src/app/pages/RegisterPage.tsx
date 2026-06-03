import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuxCordLogo } from '../components/AuxCordLogo';
import { Mail, Lock, User } from 'lucide-react';
import { api } from '../services/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address.';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters long.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (validateForm()) {
      try {
        const res = await api.register({ name, email, password }); 
        localStorage.setItem('userName', res.name);
        localStorage.setItem('userRole', res.role?.name || 'USER'); 
        navigate('/party/select');
      } catch (err: any) {
        setServerError(err.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AuxCordLogo className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Join AuxQueue</h1>
          <p className="text-[#b3b3b3]">Create your account and start curating</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-[#181818] rounded-lg p-8 space-y-6">
          {serverError && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm text-center">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
              <input
                id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe"
                className={`w-full bg-[#282828] border ${errors.name ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-12 text-white focus:ring-2 focus:ring-[#1DB954] focus:outline-none`}
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
              <input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className={`w-full bg-[#282828] border ${errors.email ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-12 text-white focus:ring-2 focus:ring-[#1DB954] focus:outline-none`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
              <input
                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className={`w-full bg-[#282828] border ${errors.password ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-12 text-white focus:ring-2 focus:ring-[#1DB954] focus:outline-none`}
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
              <input
                id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                className={`w-full bg-[#282828] border ${errors.confirmPassword ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-12 text-white focus:ring-2 focus:ring-[#1DB954] focus:outline-none`}
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <button type="submit" className="w-full bg-[#1DB954] text-black font-bold py-3 rounded-full hover:bg-[#1ed760] transition-all">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}