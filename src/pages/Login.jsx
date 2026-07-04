import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import './Auth.css';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/home');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let email = identifier;

            if (!identifier.includes('@')) {
                const usernameRef = doc(db, 'usernames', identifier.toLowerCase());
                const usernameSnap = await getDoc(usernameRef);

                if (usernameSnap.exists()) {
                    email = usernameSnap.data().email;
                } else {
                    setLoading(false);
                    return setError('Username not found');
                }
            }

            await signInWithEmailAndPassword(auth, email, password);
            navigate('/home');
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user already exists in Firestore
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // First-time Google login – create Firestore documents
                const lowerEmail = user.email.toLowerCase();
                const lowerUsername = lowerEmail.split('@')[0];

                await setDoc(doc(db, 'usernames', lowerUsername), {
                    uid: user.uid,
                    email: lowerEmail
                });

                await setDoc(userRef, {
                    uid: user.uid,
                    username: lowerUsername,
                    email: lowerEmail,
                    name: user.displayName || '',
                    location: '',
                    phoneNumber: user.phoneNumber || '',
                    createdAt: serverTimestamp(),
                });

                await setDoc(doc(db, 'users', user.uid, 'wallet', 'summary'), {
                    ecopoints: 0,
                    points: 0,
                    level: 'Bronze',
                    updateat: serverTimestamp(),
                    CreatedAt: serverTimestamp()
                });
            }

            navigate('/home');
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Google sign-in was cancelled.');
            } else {
                setError('Google sign-in failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

// Icon definitions
const MailIcon = () => (
    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><polyline points="3 7 12 13 21 7"></polyline>
    </svg>
);

const LockIcon = () => (
    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

const GoogleIcon = () => (
    <svg className="auth-sso-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const FacebookIcon = () => (
    <svg className="auth-sso-icon" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

    return (
        <div className="auth-container" style={{ backgroundImage: "url('/temple_bg_exact.png')" }}>
            
            <div className="auth-brand">
                <svg className="auth-brand-logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 22h20L12 2z"></path><path d="M12 22V8"></path><path d="M6 14h12"></path>
                </svg>
                <h1 className="auth-brand-title">Tamil Nadu<br />Corporate Travel</h1>
                <div className="auth-brand-subtitle">Explore | Manage | Connect</div>
            </div>

            <div className="auth-card">
                <div className="auth-header">
                    <h2 className="auth-title">Welcome Back.</h2>
                    <p className="auth-subtitle">Sign in to your corporate travel account</p>
                </div>
                {error && <div className="error-message">{error}</div>}
                
                <form className="auth-form" onSubmit={handleLogin}>
                    <div className="auth-input-group">
                        <label className="auth-label" htmlFor="identifier">Email Address</label>
                        <div className="auth-input-wrapper">
                            <MailIcon />
                            <input 
                                id="identifier" 
                                className="auth-input"
                                type="text"
                                placeholder="yourname@company.com"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="auth-input-group">
                        <div className="auth-label-row">
                            <label className="auth-label" htmlFor="password">Password</label>
                            <a href="#" className="auth-forgot">Forgot Password?</a>
                        </div>
                        <div className="auth-input-wrapper">
                            <LockIcon />
                            <input 
                                id="password" 
                                className="auth-input"
                                type="password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <button type="submit" disabled={loading} className="auth-button">
                        {loading ? 'Processing...' : 'Sign In'}
                    </button>
                    
                    <div className="auth-divider">OR</div>
                    
                    <div className="auth-sso-group">
                        <button type="button" className="auth-sso-btn" onClick={handleGoogleLogin} disabled={loading}>
                            <GoogleIcon /> Google
                        </button>
                        <button type="button" className="auth-sso-btn">
                            <FacebookIcon /> Facebook
                        </button>
                    </div>
                </form>
                
                <div className="auth-footer">
                    Don't have an account? <span onClick={() => navigate('/signup')} className="auth-link">Request access</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
