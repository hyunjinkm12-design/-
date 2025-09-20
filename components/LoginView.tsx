import React, { useState } from 'react';

interface LoginViewProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onSignUp: (email: string, password: string, displayName: string) => Promise<void>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSignUp }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            if (mode === 'login') {
                await onLogin(email.trim(), password);
            } else { // signup mode
                if (password !== confirmPassword) {
                    setError("Passwords do not match.");
                    return;
                }
                 if (password.length < 6) {
                    setError("Password must be at least 6 characters long.");
                    return;
                }
                if (!displayName.trim()) {
                    setError("Display Name cannot be empty.");
                    return;
                }
                await onSignUp(email.trim(), password, displayName.trim());
            }
        } catch (err: any) {
            switch (err.code) {
                case 'auth/invalid-email':
                    setError('Please enter a valid email address.');
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('Invalid email or password.');
                    break;
                case 'auth/email-already-in-use':
                    setError('This email address is already in use.');
                    break;
                default:
                    setError('An unexpected error occurred. Please try again.');
                    break;
            }
        }
    };
    
    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'signup' : 'login');
        setError(null);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
    };

    const isLogin = mode === 'login';
    const isSubmitDisabled = !email.trim() || !password.trim() || (!isLogin && (!confirmPassword.trim() || !displayName.trim()));

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-10">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900">Project Schedule Manager</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    {!isLogin && (
                         <div>
                            <label htmlFor="displayName" className="block text-base font-medium text-gray-700">
                                Display Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="displayName"
                                    name="displayName"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-base font-medium text-gray-700">
                            Email Address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                                placeholder="Enter your email address"
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="password" className="block text-base font-medium text-gray-700">
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div>
                            <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-base"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                            disabled={isSubmitDisabled}
                        >
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>
                </form>
                 <div className="mt-6 text-center">
                    <button onClick={toggleMode} className="text-base font-medium text-indigo-600 hover:text-indigo-500">
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </div>
            <footer className="mt-8 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} Project Schedule Manager. All rights reserved.</p>
            </footer>
        </div>
    );
};