import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuxCordLogo } from '../components/AuxCordLogo';
import { Mail, Lock, Shield, Key } from 'lucide-react';
import { api } from '../services/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'login' | '2fa' | 'forgot' | 'reset'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email.includes('@')) newErrors.email = 'Please enter a valid email address.';
    if (view === 'login' && password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (view === '2fa' && pin.length !== 6) newErrors.pin = 'PIN must be 6 digits.';
    if (view === 'reset') {
      if (!recoveryToken) newErrors.recoveryToken = 'Token is required.';
      if (password.length < 8) newErrors.password = 'New password must be at least 8 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');
    if (validateForm()) {
      try {
        const res = await api.login({ email, password });
        if (res.token === 'PENDING_2FA') {
          setView('2fa');
          setServerSuccess('A 6-digit PIN has been sent to your email.');
        } else {
          localStorage.setItem('userName', res.name);
          localStorage.setItem('userRole', res.role?.name || 'USER');
          navigate('/party/select');
        }
      } catch (err: any) {
        setServerError(err.message || 'Login failed');
      }
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (validateForm()) {
      try {
        const res = await api.verify2FA({ email, pin });
        localStorage.setItem('userName', res.name);
        localStorage.setItem('userRole', res.role?.name || 'USER');
        navigate('/party/select');
      } catch (err: any) {
        setServerError(err.message || 'Invalid PIN');
      }
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (validateForm()) {
      try {
        await api.requestPasswordRecovery(email);
        setView('reset');
        setServerSuccess('If an account exists, a recovery token has been sent.');
      } catch (err: any) {
        setServerError(err.message || 'Failed to request recovery');
      }
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (validateForm()) {
      try {
        await api.resetPassword({ email, token: recoveryToken, newPassword: password });
        setView('login');
        setPassword('');
        setServerSuccess('Password successfully reset. You can now log in.');
      } catch (err: any) {
        setServerError(err.message || 'Failed to reset password');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AuxCordLogo className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">
            {view === 'login' ? 'Welcome Back' : view === '2fa' ? 'Verify Identity' : 'Account Recovery'}
          </h1>
          <p className="text-[#b3b3b3]">
            {view === 'login' ? 'Sign in to continue to AuxQueue' : view === '2fa' ? 'Enter the PIN sent to your email' : 'Secure your account'}
          </p>
        </div>

        <form 
          onSubmit={
            view === 'login' ? handleLoginSubmit : 
            view === '2fa' ? handle2FASubmit : 
            view === 'forgot' ? handleForgotSubmit : 
            handleResetSubmit
          } 
          noValidate 
          className="bg-[#181818] rounded-lg p-8 space-y-6"
        >
          {serverError && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm text-center">
              {serverError}
            </div>
          )}
          {serverSuccess && (
            <div className="bg-[#1DB954]/20 border border-[#1DB954] text-[#1DB954] p-3 rounded-md text-sm text-center">
              {serverSuccess}
            </div>
          )}
          
          {(view === 'login' || view === 'forgot') && (
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                  className={`w-full bg-[#282828] border ${errors.email ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-12 text-white placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#1DB954]`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          )}

          {(view === 'login' || view === 'reset') && (
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2">
                {view === 'reset' ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
                <input
                  id="password" type="password" value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                  className={`w-full bg-[#282828] border ${errors.password ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-12 text-white placeholder-[#b3b3b3] focus:outline-none focus:ring-2 focus:ring-[#1DB954]`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          )}

          {view === '2fa' && (
            <div>
              <label htmlFor="pin" className="block text-sm font-semibold mb-2">6-Digit PIN</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
                <input
                  id="pin" type="text" value={pin} maxLength={6}
                  onChange={(e) => { setPin(e.target.value); if (errors.pin) setErrors({ ...errors, pin: '' }); }}
                  className={`w-full bg-[#282828] border ${errors.pin ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-12 text-white tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#1DB954]`}
                  placeholder="000000"
                />
              </div>
              {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin}</p>}
            </div>
          )}

          {view === 'reset' && (
            <div>
              <label htmlFor="recoveryToken" className="block text-sm font-semibold mb-2">Recovery Token</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
                <input
                  id="recoveryToken" type="text" value={recoveryToken}
                  onChange={(e) => { setRecoveryToken(e.target.value); if (errors.recoveryToken) setErrors({ ...errors, recoveryToken: '' }); }}
                  className={`w-full bg-[#282828] border ${errors.recoveryToken ? 'border-red-500' : 'border-[#535353]'} rounded-md py-3 px-12 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954]`}
                  placeholder="Paste token here"
                />
              </div>
              {errors.recoveryToken && <p className="text-red-500 text-xs mt-1">{errors.recoveryToken}</p>}
            </div>
          )}

          <button type="submit" className="w-full bg-[#1DB954] text-black font-bold py-3 rounded-full hover:bg-[#1ed760] hover:scale-105 transition-all">
            {view === 'login' ? 'Sign In' : view === '2fa' ? 'Verify PIN' : view === 'forgot' ? 'Send Recovery Email' : 'Reset Password'}
          </button>

          <div className="text-center mt-4 text-sm text-[#b3b3b3] space-y-2">
            {view === 'login' && (
              <>
                <p><button type="button" onClick={() => setView('forgot')} className="text-white hover:underline">Forgot your password?</button></p>
                <p>Don't have an account? <Link to="/register" className="text-white hover:underline">Sign up</Link></p>
              </>
            )}
            {view !== 'login' && (
              <p><button type="button" onClick={() => { setView('login'); setServerSuccess(''); setServerError(''); }} className="text-white hover:underline">Back to Login</button></p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}