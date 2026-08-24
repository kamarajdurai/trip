import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Lazy load route components
const PlanTrip = lazy(() => import('./pages/PlanTrip'));
const VR = lazy(() => import('./pages/VR'));
const AR = lazy(() => import('./pages/AR'));
const Culinary = lazy(() => import('./pages/Culinary/Culinary/Culinary'));
const Agri = lazy(() => import('./pages/Agri/Agri/Agri'));
const Booking = lazy(() => import('./pages/Booking'));
const Event = lazy(() => import('./pages/Event'));
const Guide = lazy(() => import('./pages/Guide'));
const GuideDashboard = lazy(() => import('./pages/GuideDashboard'));
const GuideRegistration = lazy(() => import('./pages/GuideRegistration'));
const GuideDetail = lazy(() => import('./pages/GuideDetail'));
const Medical = lazy(() => import('./pages/Medical/Medical/Medical'));
const TripHistory = lazy(() => import('./pages/TripHistory'));
const WalletDashboard = lazy(() => import('./pages/WalletDashboard'));
const WhereToGo = lazy(() => import('./pages/WhereToGo'));

import { TripProvider } from './context/TripContext';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <TripProvider>
            <Router>
                <Suspense fallback={
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f4f8', color: '#2d6a4f', fontFamily: 'sans-serif', fontWeight: 'bold' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '40px', height: '40px', border: '4px solid #2d6a4f', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            <div>Loading TNVerse...</div>
                        </div>
                    </div>
                }>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />

                        <Route path="/preview/plan-trip" element={<ProtectedRoute><PlanTrip /></ProtectedRoute>} />
                        <Route path="/preview/ar" element={<ProtectedRoute><AR /></ProtectedRoute>} />
                        <Route path="/preview/vr" element={<VR />} />

                        {/* Public TnVerse Routes */}
                        <Route path="/culinary" element={<Culinary />} />
                        <Route path="/agri" element={<Agri />} />
                        <Route path="/medical" element={<Medical />} />

                        <Route path="/home" element={<Home />} />
                        <Route path="/trip-history" element={<ProtectedRoute><TripHistory /></ProtectedRoute>} />
                        <Route path="/wallet" element={<ProtectedRoute><WalletDashboard /></ProtectedRoute>} />
                        <Route path="/plan-trip" element={<ProtectedRoute><PlanTrip /></ProtectedRoute>} />
                        <Route path="/vr" element={<VR />} />
                        <Route path="/ar" element={<AR />} />

                        <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                        <Route path="/event" element={<ProtectedRoute><Event /></ProtectedRoute>} />
                        <Route path="/guide" element={<ProtectedRoute><Guide /></ProtectedRoute>} />
                        <Route path="/guide/:id" element={<ProtectedRoute><GuideDetail /></ProtectedRoute>} />
                        <Route path="/guide-dashboard" element={<ProtectedRoute><GuideDashboard /></ProtectedRoute>} />
                        <Route path="/guide-registration" element={<ProtectedRoute><GuideRegistration /></ProtectedRoute>} />
                        <Route path="/where-to-go" element={<WhereToGo />} />
                    </Routes>
                </Suspense>
            </Router>
        </TripProvider>
    );
}

export default App;

