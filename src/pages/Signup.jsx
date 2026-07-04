import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import './Auth.css';

const Signup = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
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

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const lowerEmail = email.toLowerCase();
            const usernameStr = lowerEmail.split('@')[0];
            const lowerUsername = usernameStr.toLowerCase();

            const usernameRef = doc(db, 'usernames', lowerUsername);
            const usernameSnap = await getDoc(usernameRef);

            if (usernameSnap.exists()) {
                setLoading(false);
                return setError('Username derived from email is already taken. Please use another email.');
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(usernameRef, {
                uid: user.uid,
                email: lowerEmail
            });

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                username: lowerUsername,
                email: lowerEmail,
                name: fullName,
                location: '',
                phoneNumber: phoneNumber,
                createdAt: serverTimestamp(),
            });

            await setDoc(doc(db, 'users', user.uid, 'wallet', 'summary'), {
                ecopoints: 0,
                points: 0,
                level: 'Bronze',
                updateat: serverTimestamp(),
                CreatedAt: serverTimestamp()
            });

            alert("Registration successful! Please log in with your credentials.");
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

// Icon definitions
const UserIcon = () => (
    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const MailIcon = () => (
    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect><polyline points="3 7 12 13 21 7"></polyline>
    </svg>
);

const PhoneIcon = () => (
    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const LockIcon = () => (
    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
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
                    <h2 className="auth-title">Create Account.</h2>
                    <p className="auth-subtitle">Join us to explore amazing travel experiences.</p>
                </div>
                {error && <div className="error-message">{error}</div>}
                
                <form className="auth-form" onSubmit={handleSignup}>
                    <div className="auth-input-group">
                        <label className="auth-label" htmlFor="full_name">Full Name</label>
                        <div className="auth-input-wrapper">
                            <UserIcon />
                            <input 
                                id="full_name" 
                                className="auth-input"
                                type="text"
                                placeholder="Jane Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="auth-input-group">
                        <label className="auth-label" htmlFor="email">Email Address</label>
                        <div className="auth-input-wrapper">
                            <MailIcon />
                            <input 
                                id="email" 
                                className="auth-input"
                                type="email"
                                placeholder="jane@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="auth-input-group">
                        <label className="auth-label" htmlFor="phone">Phone Number</label>
                        <div className="auth-input-wrapper">
                            <PhoneIcon />
                            <input 
                                id="phone" 
                                className="auth-input"
                                type="tel"
                                placeholder="+1 555-0000"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="auth-input-group">
                        <label className="auth-label" htmlFor="password">Password</label>
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
                        {loading ? 'Processing...' : 'Sign Up'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    Already have an account? <span onClick={() => navigate('/login')} className="auth-link">Sign In</span>
                </div>
            </div>
        </div>
    );
};

export default Signup;
