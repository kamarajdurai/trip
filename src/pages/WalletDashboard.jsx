import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment, getDoc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Navbar from '../components/Navbar';
import SubmitTaskModal from '../components/SubmitTaskModal';
import Footer from '../components/Footer';

import './WalletDashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const WalletDashboard = () => {
    const [trips, setTrips] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        let unsubWallet = () => { };
        let unsubTrips = () => { };
        let unsubSubmissions = () => { };
        let unsubTransactions = () => { };
        let unsubCoupons = () => { };

        // Main Auth Listener
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            // Always cleanup prev listeners when auth state changes
            unsubWallet();
            unsubTrips();
            unsubSubmissions();
            unsubTransactions();
            unsubCoupons();

            if (user) {
                // 1. Wallet Summary Listener
                unsubWallet = onSnapshot(doc(db, 'users', user.uid, 'wallet', 'summary'), (snap) => {
                    setWallet(snap.exists() ? snap.data() : {});
                });

                // 2. Trips Listener
                const q = query(collection(db, 'users', user.uid, 'trips'), orderBy('createdAt', 'desc'));
                unsubTrips = onSnapshot(q, (snap) => {
                    const tripList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTrips(tripList);
                    // Default select first trip if none selected
                    if (tripList.length > 0 && !selectedTrip) {
                        setSelectedTrip(tripList[0]);
                    }
                    setLoading(false);
                });

                // 3. Submissions Listener
                const subQ = query(collection(db, 'users', user.uid, 'taskSubmissions'), orderBy('submittedAt', 'desc'));
                unsubSubmissions = onSnapshot(subQ, (snap) => {
                    setSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });

                // 4. Transactions Listener
                const txQ = query(collection(db, 'users', user.uid, 'wallet', 'transactions'), orderBy('timestamp', 'desc'));
                unsubTransactions = onSnapshot(txQ, (snap) => {
                    setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });

                // 5. Coupons Listener
                const cpQ = query(collection(db, 'users', user.uid, 'wallet', 'coupons'), orderBy('redeemedAt', 'desc'));
                unsubCoupons = onSnapshot(cpQ, (snap) => {
                    setCoupons(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });

            } else {
                setLoading(false);
            }
        });

        // Cleanup on unmount
        return () => {
            unsubscribeAuth();
            unsubWallet();
            unsubTrips();
            unsubSubmissions();
            unsubTransactions();
            unsubCoupons();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEarnCoins = async (coins, taskName) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const walletRef = doc(db, 'users', user.uid, 'wallet', 'summary');
            await updateDoc(walletRef, {
                ecopoints: increment(coins),
                points: increment(coins)
            });

            // Log Transaction to Firestore
            await addDoc(collection(db, 'users', user.uid, 'wallet', 'transactions'), {
                amount: coins,
                type: 'credit',
                description: `Completed task: ${taskName}`,
                category: 'task',
                timestamp: serverTimestamp()
            });

            alert(`You earned ${coins} Eco-Coins for: ${taskName}!`);
        } catch (err) {
            console.error("Error earning coins:", err);
        }
    };

    const handleRedeemReward = async (reward) => {
        const user = auth.currentUser;
        if (!user) return;

        const currentBalance = calculatedEcoPoints;

        if (currentBalance < reward.cost) {
            alert(`Insufficient Eco Coins! You need ${reward.cost} coins but only have ${currentBalance}.`);
            return;
        }

        if (!window.confirm(`Redeem "${reward.name}" for ${reward.cost} Eco Coins?`)) {
            return;
        }

        try {
            const couponCode = reward.codePrefix + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            
            // 1. Add Coupon Document
            await addDoc(collection(db, 'users', user.uid, 'wallet', 'coupons'), {
                couponCode,
                rewardName: reward.name,
                cost: reward.cost,
                redeemedAt: new Date().toISOString(),
                status: 'active'
            });

            // 2. Add Debit Transaction to Ledger
            await addDoc(collection(db, 'users', user.uid, 'wallet', 'transactions'), {
                amount: reward.cost,
                type: 'debit',
                description: `Redeemed reward: ${reward.name}`,
                category: 'redemption',
                timestamp: serverTimestamp()
            });

            alert(`Success! Redeemed reward. Your code is: ${couponCode}`);
        } catch (err) {
            console.error("Error redeeming reward:", err);
            alert("Failed to redeem reward. Please try again.");
        }
    };

    const downloadReport = async () => {
        const element = document.getElementById('dashboard-report');
        if (!element) return;
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Travel_Wallet_Report.pdf');
    };

    // Helper to calculate spent amount safely (fallback for old trips)
    const calculateTripSpent = (t) => {
        const direct = Number(t.actualExpenditure) || 0;
        if (direct > 0) return direct;

        // Fallback: Sum individual expenses
        return (Number(t.foodExpense) || 0) +
            (Number(t.transportExpense) || 0) +
            (Number(t.adventureExpense) || 0) +
            (Number(t.othersExpense) || 0);
    };

    // --- Derived State & Calculations ---
    const calculatedTotalBudget = trips.reduce((sum, t) => sum + (Number(t.plannedBudget) || 0), 0);
    const calculatedTotalSpent = trips.reduce((sum, t) => sum + calculateTripSpent(t), 0);
    const moneySaved = calculatedTotalBudget - calculatedTotalSpent;

    const tripEcoPoints = trips.length * 50;
    const taskEcoPoints = submissions.reduce((sum, s) => sum + (Number(s.coinsEarned) || 0), 0);
    const totalSpentCoins = coupons.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);
    const calculatedEcoPoints = Math.max(0, (tripEcoPoints + taskEcoPoints) - totalSpentCoins);

    // Self-Healing: Sync DB if mismatch detected
    useEffect(() => {
        if (!wallet || loading) return;
        if (wallet.ecopoints !== calculatedEcoPoints) {
            const user = auth.currentUser;
            if (user) {
                const walletRef = doc(db, 'users', user.uid, 'wallet', 'summary');
                updateDoc(walletRef, { ecopoints: calculatedEcoPoints, points: calculatedEcoPoints })
                    .catch(e => console.error("Auto-healing wallet failed", e));
            }
        }
    }, [wallet, calculatedEcoPoints, loading]);

    // --- Chart Data ---
    const lineChartData = {
        labels: trips.map(t => t.title).reverse(),
        datasets: [
            {
                label: 'Planned Budget',
                data: trips.map(t => t.plannedBudget).reverse(),
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                fill: true,
            },
            {
                label: 'Actual Spent',
                data: trips.map(t => calculateTripSpent(t)).reverse(),
                borderColor: '#800020',
                backgroundColor: 'rgba(255, 69, 0, 0.2)',
                fill: true,
            }
        ]
    };

    const expenseBreakdownData = selectedTrip ? {
        labels: ['Food', 'Transport', 'Adventure', 'Others'],
        datasets: [{
            data: [
                selectedTrip.foodExpense || 0,
                selectedTrip.transportExpense || 0,
                selectedTrip.adventureExpense || 0,
                selectedTrip.othersExpense || 0
            ],
            backgroundColor: ['#ff9f43', '#54a0ff', '#5f27cd', '#48dbfb'],
            borderWidth: 0
        }]
    } : null;

    const ecoTasks = [
        { name: 'Used Public Transport', coins: 20, icon: 'fa-bus', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&auto=format&fit=crop' },
        { name: 'Avoided Plastic Bottle', coins: 10, icon: 'fa-bottle-water', img: 'https://images.unsplash.com/photo-1627483262268-9c2b5b2834b5?w=100&auto=format&fit=crop' },
        { name: 'Ate Local Cuisine', coins: 15, icon: 'fa-plate-wheat', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&auto=format&fit=crop' },
        { name: 'Supported Artisans', coins: 25, icon: 'fa-shop', img: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=100&auto=format&fit=crop' }
    ];

    const ecoRewards = [
        { id: 1, name: '₹200 Off Salem Historical Guide Booking', cost: 200, codePrefix: 'SLM-GUIDE', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop' },
        { id: 2, name: 'Free Entrance to Ooty Tea Estate Tour', cost: 150, codePrefix: 'OTY-TEA', img: 'https://images.unsplash.com/photo-1548013146-72479768b921?w=200&auto=format&fit=crop' },
        { id: 3, name: 'Organic Lunch at Ooty Agri-Farm', cost: 100, codePrefix: 'OTY-FARM', img: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=200&auto=format&fit=crop' },
        { id: 4, name: '15% Off Madurai Heritage Stays', cost: 250, codePrefix: 'MDU-STAY', img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=200&auto=format&fit=crop' }
    ];

    if (loading) return <div className="wallet-dashboard-loading">Loading Analytics...</div>;

    return (
        <div className="wallet-dashboard" style={{ padding: 0 }}>
            <Navbar />

            <div className="wallet-hero">
                <motion.h1
                    className="dashboard-title"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Adventure Wallet
                </motion.h1>
                <motion.p
                    className="dashboard-subtitle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Track your spending, master your budget, and grow your eco-impact.
                </motion.p>

                <div className="report-actions" style={{ justifyContent: 'center', marginTop: '30px' }}>
                    <button className="download-btn" onClick={downloadReport}>
                        <i className="fa-solid fa-file-pdf"></i> Download Report
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="wallet-tabs-container">
                <button className={`wallet-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    <i className="fa-solid fa-chart-pie"></i> Overview & Budget
                </button>
                <button className={`wallet-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
                    <i className="fa-solid fa-receipt"></i> Transaction Ledger
                </button>
                <button className={`wallet-tab-btn ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => setActiveTab('rewards')}>
                    <i className="fa-solid fa-store"></i> Rewards Shop
                </button>
            </div>

            <div id="dashboard-report">
                {activeTab === 'overview' && (
                    <>
                        <div className="overview-grid">
                            <motion.div className="overview-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <div className="card-icon"><i className="fa-solid fa-plane"></i></div>
                                <div className="card-value">{trips.length}</div>
                                <div className="card-label">Total Trips</div>
                            </motion.div>
                            <motion.div className="overview-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <div className="card-icon"><i className="fa-solid fa-sack-dollar"></i></div>
                                <div className="card-value">₹{calculatedTotalSpent.toLocaleString()}</div>
                                <div className="card-label">Total Spent</div>
                            </motion.div>
                            <motion.div className="overview-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ borderColor: moneySaved >= 0 ? '#2ecc71' : '#ff4757' }}>
                                <div className="card-icon" style={{ color: moneySaved >= 0 ? '#2ecc71' : '#ff4757' }}>
                                    <i className={moneySaved >= 0 ? "fa-solid fa-piggy-bank" : "fa-solid fa-triangle-exclamation"}></i>
                                </div>
                                <div className="card-value">₹{Math.abs(moneySaved).toLocaleString()}</div>
                                <div className="card-label">{moneySaved >= 0 ? 'Total Saved' : 'Overspent'}</div>
                            </motion.div>
                            <motion.div className="overview-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                <div className="card-icon"><i className="fa-solid fa-coins"></i></div>
                                <div className="card-value">{calculatedEcoPoints}</div>
                                <div className="card-label">Eco Coins</div>
                            </motion.div>
                        </div>

                        <div className="analytics-grid">
                            <div className="chart-container">
                                <h3>Trip-wise Budget Insight</h3>
                                <div style={{ height: '300px' }}>
                                    {trips.length > 0 ? (
                                        <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
                                    ) : (
                                        <div className="empty-chart">
                                            <i className="fa-solid fa-chart-line"></i>
                                            <p>No trips added yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <h3>Expense Distribution & Budget Health</h3>
                                
                                {selectedTrip ? (
                                    <div className="budget-health-container" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <div style={{ flex: 1, height: '180px', display: 'flex', justifyContent: 'center' }}>
                                            <Doughnut data={expenseBreakdownData} options={{ maintainAspectRatio: false }} />
                                        </div>
                                        
                                        {/* Dynamic Budget Progress Gauge Widget (Idea 3) */}
                                        {(() => {
                                            const calcSpent = calculateTripSpent(selectedTrip);
                                            const calcBudget = Number(selectedTrip.plannedBudget) || 1;
                                            const spendPercent = Math.min(Math.round((calcSpent / calcBudget) * 100), 100);
                                            
                                            let advisoryMsg = "On Track! You are spending within your planned limits.";
                                            let advisoryColor = "#2ecc71";
                                            let alertClass = "budget-alert-good";
                                            
                                            if (spendPercent > 85) {
                                                advisoryMsg = "Warning: Budget is almost consumed! Consider cheap local alternatives.";
                                                advisoryColor = "#ff4757";
                                                alertClass = "budget-alert-bad";
                                            } else if (spendPercent > 50) {
                                                advisoryMsg = "Watchful: Spent over half of your budget. Spend cautiously.";
                                                advisoryColor = "#ffa502";
                                                alertClass = "budget-alert-warn";
                                            }
                                            
                                            return (
                                                <div style={{ flex: 1 }} className={`budget-gauge-widget ${alertClass}`}>
                                                    <div className="gauge-circle-outer" style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto' }}>
                                                        <svg viewBox="0 0 36 36" className="circular-chart" style={{ width: '100%', height: '100%' }}>
                                                            <path className="circle-bg" stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                            <path className="circle-fill" stroke={advisoryColor} strokeDasharray={`${spendPercent}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                        </svg>
                                                        <div className="gauge-text" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold', fontSize: '1.1rem', color: 'white' }}>
                                                            {spendPercent}%
                                                        </div>
                                                    </div>
                                                    <div className="advisory-text" style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '10px', color: advisoryColor, fontWeight: '600', lineHeight: '1.3' }}>
                                                        {advisoryMsg}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="empty-chart" style={{ height: '180px' }}>
                                        <i className="fa-solid fa-chart-pie"></i>
                                        <p>Select a trip to see details</p>
                                    </div>
                                )}

                                {trips.length > 0 && (
                                    <select
                                        className="styled-select"
                                        onChange={(e) => setSelectedTrip(trips.find(t => t.id === e.target.value))}
                                        value={selectedTrip?.id}
                                        style={{ marginTop: 'auto' }}
                                    >
                                        {trips.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Timeline View */}
                        {selectedTrip?.timeline && (
                            <div className="timeline-section">
                                <h2>📍 {selectedTrip.title} - Journey Timeline</h2>
                                <div className="vertical-timeline">
                                    {selectedTrip.timeline.map((day, idx) => (
                                        <motion.div
                                            key={idx}
                                            className="timeline-item"
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                        >
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-content">
                                                <span className="day-tag" style={{ color: '#800020', fontWeight: 'bold' }}>Day {day.day}</span>
                                                <h4 style={{ margin: '5px 0' }}><i className="fa-solid fa-location-dot"></i> {day.location || 'Explore'}</h4>
                                                <p style={{ color: 'rgba(255,255,255,0.6)' }}>{day.activity || 'Activity planned'}</p>
                                                <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Daily Cost</span>
                                                    <span style={{ fontWeight: 'bold' }}>₹{day.expense || 0}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="eco-main-layout">
                            <div className="eco-left-tasks">
                                <h2 className="section-title">🌱 Eco-Friendly Activities</h2>
                                <div className="task-grid-compact">
                                    {ecoTasks.map((task, idx) => (
                                        <div key={idx} className="task-mini-card">
                                            <img src={task.img} alt={task.name} className="task-img-thumb" />
                                            <div className="task-info">
                                                <h4>{task.name}</h4>
                                                <span>+{task.coins} Coins</span>
                                            </div>
                                            <i className={`fa-solid ${task.icon} task-bg-icon`}></i>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="eco-right-portal">
                                <div className="portal-header">
                                    <h2 className="section-title">📸 Proof Portal</h2>
                                    <button className="btn-portal-action" onClick={() => setIsTaskModalOpen(true)}>
                                        <i className="fa-solid fa-upload"></i> Upload Proof
                                    </button>
                                </div>

                                <div className="verification-status-card">
                                    <div className="status-header">
                                        <span>Verification Status</span>
                                        <span className="status-tag">Active</span>
                                    </div>
                                    <div className="progress-container">
                                        <div className="progress-labels">
                                            <label>Daily Goal</label>
                                            <span>{submissions.length * 20}%</span>
                                        </div>
                                        <div className="progress-bar-bg">
                                            <motion.div
                                                className="progress-bar-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(submissions.length * 20, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="recent-activity-mini">
                                        <h3>Last Submission</h3>
                                        {submissions.length > 0 ? (
                                            <div className="activity-item">
                                                <i className="fa-solid fa-circle-check"></i>
                                                <span>{submissions[0].taskName}</span>
                                                <label>Verified</label>
                                            </div>
                                        ) : (
                                            <p>Waiting for your first green move!</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="badges-full-section">
                            <h2 className="section-title">🎖️ Travel & Eco Achievements</h2>
                            <div className="badge-belt">
                                {[
                                    { name: 'Eco Hero', icon: '🌱', threshold: 100 },
                                    { name: 'Budget Master', icon: '💰', threshold: 50 },
                                    { name: 'Explorer', icon: '🌍', threshold: 5 },
                                    { name: 'Green Pro', icon: '🍀', threshold: 500 },
                                    { name: 'TN Guide', icon: '🏯', threshold: 200 },
                                    { name: 'Legend', icon: '👑', threshold: 1000 }
                                ].map((badge, idx) => (
                                    <div key={idx} className={`badge-capsule ${calculatedEcoPoints >= badge.threshold ? 'earned' : ''}`}>
                                        <span className="capsule-icon">{badge.icon}</span>
                                        <div className="capsule-text">
                                            <h5>{badge.name}</h5>
                                            <p>{badge.threshold} Coins</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="overall-progress-container">
                                <div className="progress-labels">
                                    <label>Elite Journey Level</label>
                                    <span>{calculatedEcoPoints} / 1000 Coins</span>
                                </div>
                                <div className="progress-bar-bg" style={{ height: '15px' }}>
                                    <motion.div
                                        className="progress-bar-fill"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((calculatedEcoPoints / 1000) * 100, 100)}%` }}
                                        style={{ background: 'linear-gradient(to right, #800020, #2ecc71)' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '10px', textAlign: 'center' }}>
                                    {calculatedEcoPoints >= 1000 ? "You've reached Legend status!" : `Collect ${1000 - calculatedEcoPoints} more coins to become a TN Legend.`}
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'ledger' && (
                    <motion.div className="ledger-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 className="section-title">📊 Transaction History</h2>
                        <div className="ledger-table-wrapper" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {transactions.length > 0 ? (
                                <table className="ledger-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                                            <th style={{ padding: '15px' }}>Date</th>
                                            <th style={{ padding: '15px' }}>Description</th>
                                            <th style={{ padding: '15px' }}>Category</th>
                                            <th style={{ padding: '15px' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' }}>
                                                <td style={{ padding: '15px', color: 'rgba(255,255,255,0.7)' }}>{tx.timestamp ? new Date(tx.timestamp.toDate()).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending'}</td>
                                                <td style={{ padding: '15px', fontWeight: '500' }}>{tx.description}</td>
                                                <td style={{ padding: '15px' }}>
                                                    <span className={`ledger-category-badge ${tx.category}`} style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        fontWeight: 'bold',
                                                        background: tx.category === 'task' ? 'rgba(46, 204, 113, 0.15)' : tx.category === 'trip' ? 'rgba(52, 152, 219, 0.15)' : 'rgba(155, 89, 182, 0.15)',
                                                        color: tx.category === 'task' ? '#2ecc71' : tx.category === 'trip' ? '#3498db' : '#9b59b6'
                                                    }}>{tx.category}</span>
                                                </td>
                                                <td className={`ledger-amount-col ${tx.type}`} style={{
                                                    padding: '15px',
                                                    fontWeight: 'bold',
                                                    color: tx.type === 'credit' ? '#2ecc71' : '#ff4757'
                                                }}>
                                                    {tx.type === 'credit' ? `+${tx.amount}` : `-${tx.amount}`} TnCoins
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="empty-ledger" style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.6 }}>
                                    <i className="fa-solid fa-receipt" style={{ fontSize: '3rem', marginBottom: '15px', color: '#800020' }}></i>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>No transactions recorded yet.</p>
                                    <span style={{ fontSize: '0.9rem' }}>Plan a trip or complete green tasks to start earning Eco Coins!</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rewards' && (
                    <motion.div className="rewards-shop-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="rewards-shop-layout">
                            <div className="rewards-catalog">
                                <h2 className="section-title">🛍️ Available Eco Offers</h2>
                                <div className="rewards-grid-new">
                                    {ecoRewards.map((reward) => (
                                        <div key={reward.id} className="reward-card-new">
                                            <div className="reward-img-container" style={{ position: 'relative', height: '140px' }}>
                                                <img src={reward.img} alt={reward.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px 15px 0 0' }} />
                                            </div>
                                            <div className="reward-card-body" style={{ padding: '20px' }}>
                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 'bold', minHeight: '40px' }}>{reward.name}</h4>
                                                <div className="cost-tag" style={{ color: '#2ecc71', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px' }}>
                                                    <i className="fa-solid fa-coins"></i> {reward.cost} Coins
                                                </div>
                                                <button 
                                                    className="redeem-btn-action"
                                                    onClick={() => handleRedeemReward(reward)}
                                                    disabled={calculatedEcoPoints < reward.cost}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        fontWeight: 'bold',
                                                        cursor: calculatedEcoPoints >= reward.cost ? 'pointer' : 'not-allowed',
                                                        background: calculatedEcoPoints >= reward.cost ? '#2ecc71' : 'rgba(255,255,255,0.08)',
                                                        color: calculatedEcoPoints >= reward.cost ? 'white' : 'rgba(255,255,255,0.3)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    Redeem Offer
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="my-coupons-sidebar" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)', minWidth: '300px' }}>
                                <h2 className="section-title">🎟️ My Active Coupons</h2>
                                <div className="coupons-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                    {coupons.length > 0 ? (
                                        coupons.map((cp) => (
                                            <div key={cp.id} className="coupon-ticket" style={{
                                                background: 'linear-gradient(135deg, #1e1e24, #0b0b0d)',
                                                border: '1px dashed rgba(255,255,255,0.15)',
                                                borderRadius: '12px',
                                                padding: '15px',
                                                position: 'relative'
                                            }}>
                                                <div className="coupon-ticket-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                    <h5 style={{ margin: 0, fontSize: '0.9rem', paddingRight: '10px' }}>{cp.rewardName}</h5>
                                                    <span style={{ fontSize: '0.8rem', color: '#2ecc71', fontWeight: 'bold' }}>{cp.cost}C</span>
                                                </div>
                                                <div className="coupon-code-box" style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    textAlign: 'center',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    marginBottom: '5px'
                                                }}>
                                                    <code style={{ fontSize: '1rem', color: '#ff9f43', fontWeight: 'bold', letterSpacing: '1px' }}>{cp.couponCode}</code>
                                                </div>
                                                <p className="coupon-expiry" style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5, textAlign: 'right' }}>Status: Active</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-coupons" style={{ textAlign: 'center', padding: '30px 10px', opacity: 0.5 }}>
                                            <i className="fa-solid fa-ticket" style={{ fontSize: '2.5rem', marginBottom: '10px' }}></i>
                                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold' }}>No active coupons.</p>
                                            <span style={{ fontSize: '0.8rem' }}>Redeem rewards from the catalog to see them here!</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {isTaskModalOpen && (
                <SubmitTaskModal
                    onClose={() => setIsTaskModalOpen(false)}
                    onTaskSubmitted={(coins, name) => {
                        // Task submission verification
                    }}
                />
            )}

            <Footer />
        </div>
    );
};

export default WalletDashboard;
