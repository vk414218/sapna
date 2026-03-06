
import React, { useState } from 'react';
import { User } from '../types';
import {
  getUserByPhone,
  getUserByUsername,
  saveUserGlobally,
  isFirebaseConfigured,
} from '../services/firebaseService';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  isDarkMode: boolean;
}

type AuthMode = 'login' | 'register';

const inputCls = (dark: boolean) =>
  `w-full px-4 py-3 rounded-lg outline-none transition-all ${
    dark
      ? 'bg-[#2a3942] text-white border-transparent focus:bg-[#3b4a54]'
      : 'bg-[#f0f2f5] text-[#111b21] border-[#e9edef] focus:bg-white border'
  }`;

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, isDarkMode }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Login fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sanitizeUsername = (raw: string) =>
    raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 32);

  const validateUsername = (raw: string): { value: string; error: string } => {
    const value = sanitizeUsername(raw);
    if (value.length < 3) {
      return { value, error: 'Username must be at least 3 characters (letters, numbers, _).' };
    }
    return { value, error: '' };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedPhone = loginPhone.trim();
    const trimmedName = loginName.trim();
    if (!trimmedName || !trimmedPhone) return;

    setLoading(true);
    try {
      const isAdmin =
        trimmedPhone.toLowerCase() === 'admin' || trimmedPhone === '9999999999';

      let user = await getUserByPhone(trimmedPhone);

      if (!user) {
        // First time on this device: auto-register with the supplied name
        user = {
          id: `user-${trimmedPhone.replace(/[^a-zA-Z0-9]/g, '') || `t${Date.now()}`}`,
          name: trimmedName,
          phone: trimmedPhone,
          username: trimmedPhone.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedName}`,
          status: 'online',
          isAdmin,
        };
        await saveUserGlobally(user);
      } else {
        // Existing user – update name and mark online
        user = { ...user, name: trimmedName, status: 'online', isAdmin };
        await saveUserGlobally(user);
      }

      onLogin(user);
    } catch (err) {
      console.error('[Login]', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = regName.trim();
    const trimmedPhone = regPhone.trim();
    const { value: trimmedUsername, error: usernameError } = validateUsername(regUsername);

    if (!trimmedName || !trimmedPhone || !trimmedUsername) {
      setError('Please fill in all fields.');
      return;
    }
    if (usernameError) {
      setError(usernameError);
      return;
    }

    setLoading(true);
    try {
      // Check for duplicate phone
      const existingByPhone = await getUserByPhone(trimmedPhone);
      if (existingByPhone) {
        setError('An account with this phone number already exists. Please login instead.');
        setLoading(false);
        return;
      }

      // Check for duplicate username
      const existingByUsername = await getUserByUsername(trimmedUsername);
      if (existingByUsername) {
        setError('This username is already taken. Please choose another.');
        setLoading(false);
        return;
      }

      const isAdmin =
        trimmedPhone.toLowerCase() === 'admin' || trimmedPhone === '9999999999';

      const newUser: User = {
        id: `user-${trimmedPhone.replace(/[^a-zA-Z0-9]/g, '') || `t${Date.now()}`}`,
        name: trimmedName,
        phone: trimmedPhone,
        username: trimmedUsername,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedName}`,
        status: 'online',
        isAdmin,
      };

      await saveUserGlobally(newUser);
      onLogin(newUser);
    } catch (err) {
      console.error('[Register]', err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const label = (dark: boolean) =>
    `block text-sm font-medium mb-1.5 ${dark ? 'text-[#8696a0]' : 'text-[#667781]'}`;

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${
        isDarkMode ? 'bg-[#111b21]' : 'bg-[#f0f2f5]'
      }`}
    >
      {/* Logo */}
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-[#25d366] rounded-full flex items-center justify-center mb-4 shadow-xl animate-pulse">
          <svg
            className="text-white w-12 h-12"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-[#41525d]'}`}>
          WhatsApp Pro
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
          End-to-end encrypted messaging
        </p>
        {isFirebaseConfigured && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-[#00a884]">
            <span className="w-2 h-2 rounded-full bg-[#00a884] inline-block" />
            Cloud sync enabled – find users across devices
          </span>
        )}
      </div>

      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
          isDarkMode ? 'bg-[#202c33]' : 'bg-white'
        }`}
      >
        {/* Tab switcher */}
        <div className={`flex border-b ${isDarkMode ? 'border-[#2a3942]' : 'border-[#f0f2f5]'}`}>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              mode === 'login'
                ? 'text-[#00a884] border-b-2 border-[#00a884]'
                : isDarkMode
                ? 'text-[#8696a0] hover:text-white'
                : 'text-[#667781] hover:text-[#111b21]'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${
              mode === 'register'
                ? 'text-[#00a884] border-b-2 border-[#00a884]'
                : isDarkMode
                ? 'text-[#8696a0] hover:text-white'
                : 'text-[#667781] hover:text-[#111b21]'
            }`}
          >
            New Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="p-8">
            <div className="space-y-5">
              <div>
                <label className={label(isDarkMode)}>Display Name</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Your name"
                  className={inputCls(isDarkMode)}
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={label(isDarkMode)}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9988776655"
                  className={inputCls(isDarkMode)}
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-60 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md mt-2"
              >
                {loading ? 'Please wait…' : 'Login'}
              </button>
            </div>
            <p className={`mt-6 text-center text-xs ${isDarkMode ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
              No account yet?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className="text-[#00a884] font-semibold hover:underline"
              >
                Create one
              </button>
            </p>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="p-8">
            <div className="space-y-5">
              <div>
                <label className={label(isDarkMode)}>Full Name</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Your full name"
                  className={inputCls(isDarkMode)}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={label(isDarkMode)}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9988776655"
                  className={inputCls(isDarkMode)}
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={label(isDarkMode)}>
                  Username{' '}
                  <span className={`font-normal ${isDarkMode ? 'text-[#667781]' : 'text-[#8696a0]'}`}>
                    (used for search, like @username)
                  </span>
                </label>
                <div className="relative">
                  <span
                    className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold ${
                      isDarkMode ? 'text-[#8696a0]' : 'text-[#667781]'
                    }`}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    placeholder="your_username"
                    className={`${inputCls(isDarkMode)} pl-7`}
                    value={regUsername}
                    onChange={(e) => setRegUsername(sanitizeUsername(e.target.value))}
                    minLength={3}
                    maxLength={32}
                    required
                  />
                </div>
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
                  3–32 characters: letters, numbers and underscore only.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00a884] hover:bg-[#06cf9c] disabled:opacity-60 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md mt-2"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </div>
            <p className={`mt-6 text-center text-xs ${isDarkMode ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="text-[#00a884] font-semibold hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        )}

        <div
          className={`px-8 pb-6 text-center text-xs ${
            isDarkMode ? 'text-[#8696a0]' : 'text-[#667781]'
          }`}
        >
          Hint: Use phone number&nbsp;<code>admin</code>&nbsp;or&nbsp;<code>9999999999</code>&nbsp;for
          admin tools.
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
