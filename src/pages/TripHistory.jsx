import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import AddTripModal from '../components/AddTripModal';
import TripCard from '../components/TripCard';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import './Trips.css';

const TripHistory = () => {
    const [trips, setTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tripToEdit, setTripToEdit] = useState(null);
    const detailsRef = useRef(null);

    useEffect(() => {
        let unsubscribeTrips = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (unsubscribeTrips) {
                unsubscribeTrips();
                unsubscribeTrips = null;
            }

            if (user) {
                const q = query(
                    collection(db, 'users', user.uid, 'trips'),
                    orderBy('createdAt', 'desc')
                );

                unsubscribeTrips = onSnapshot(q, (snapshot) => {
                    const tripsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setTrips(tripsData);

                    // Self-healing: Sync Wallet Stats with actual Trips data
                    const totalBudget = tripsData.reduce((sum, t) => sum + (Number(t.plannedBudget) || 0), 0);
                    const totalSpent = tripsData.reduce((sum, t) => sum + (Number(t.actualExpenditure) || 0), 0);

                    // We use updateDoc to set absolute values, ensuring consistency
                    const walletRef = doc(db, 'users', user.uid, 'wallet', 'summary');
                    updateDoc(walletRef, {
                        totalTrips: tripsData.length,
                        totalBudget: totalBudget,
                        totalSpent: totalSpent
                    }).catch(err => console.error("Error syncing wallet:", err));
                }, (err) => {
                    console.error("Trips snapshot error:", err);
                });
            } else {
                setTrips([]);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeTrips) unsubscribeTrips();
        };
    }, []);

    const [tripToDelete, setTripToDelete] = useState(null);

    const handleExplore = (trip) => {
        setSelectedTrip(trip);
        setTimeout(() => {
            detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const confirmDeleteTrip = (tripId) => {
        setTripToDelete(tripId);
    };

    const executeDelete = async () => {
        if (!tripToDelete) return;
        try {
            const tripObj = trips.find(t => t.id === tripToDelete);
            const user = auth.currentUser;
            await deleteDoc(doc(db, 'users', user.uid, 'trips', tripToDelete));

            if (tripObj) {
                const walletRef = doc(db, 'users', user.uid, 'wallet', 'summary');
                await updateDoc(walletRef, {
                    ecopoints: increment(-50)
                }).catch(() => {});
            }

            if (selectedTrip?.id === tripToDelete) {
                setSelectedTrip(null);
            }
        } catch (error) {
            console.error("Error deleting trip:", error);
        } finally {
            setTripToDelete(null);
        }
    };

    const handleEdit = (trip) => {
        setTripToEdit(trip);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTripToEdit(null);
    };

    return (
        <div className="trips-container">
            <Navbar />

            <section className="trips-hero">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    My Adventures
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Relive your best moments and plan for the next one.
                </motion.p>
                <motion.button
                    className="add-trip-btn"
                    onClick={() => { setTripToEdit(null); setIsModalOpen(true); }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <i className="fa-solid fa-plus"></i> Add Trip
                </motion.button>
            </section>

            {trips.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '40px auto', background: '#fff', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>🎒</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '10px', color: '#1a1a1a' }}>No Adventures Yet!</h3>
                    <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.6' }}>
                        You haven't recorded any trips yet. Add your past trips or start planning an upcoming one!
                    </p>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        style={{ background: '#810000', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '9999px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' }}
                    >
                        Log Your First Trip +
                    </button>
                </div>
            ) : (
                <div className="trips-grid">
                    {trips.map(trip => (
                        <TripCard
                            key={trip.id}
                            trip={trip}
                            onExplore={handleExplore}
                            onEdit={() => handleEdit(trip)}
                            onDelete={() => confirmDeleteTrip(trip.id)}
                        />
                    ))}
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {tripToDelete && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🗑️</div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '10px' }}>Delete Adventure?</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Are you sure you want to delete this trip? This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button 
                                onClick={() => setTripToDelete(null)}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #ddd', background: '#f8f9fa', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={executeDelete}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedTrip && (
                <section ref={detailsRef} className="trip-details-expanded">
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: '800' }}>{selectedTrip.title}</h2>
                                <p style={{ fontSize: '1.2rem', color: '#800020' }}>{selectedTrip.destination}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p><strong>Duration:</strong> {selectedTrip.duration} Days</p>
                                <p><strong>Transport:</strong> {selectedTrip.transport}</p>
                            </div>
                        </div>

                        <div className="form-grid" style={{ marginBottom: '3rem' }}>
                            <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '20px' }}>
                                <h3 style={{ marginBottom: '1rem', color: '#2d3436' }}>📊 Trip Stats</h3>
                                {(() => {
                                    // Calculate Total Spent (Fallback logic similar to Wallet)
                                    const calcSpent = Number(selectedTrip.actualExpenditure) > 0
                                        ? Number(selectedTrip.actualExpenditure)
                                        : (Number(selectedTrip.foodExpense) || 0) + (Number(selectedTrip.transportExpense) || 0) + (Number(selectedTrip.adventureExpense) || 0) + (Number(selectedTrip.othersExpense) || 0);

                                    const calcBudget = Number(selectedTrip.plannedBudget) || 0;
                                    const calcSaved = calcBudget - calcSpent;

                                    return (
                                        <>
                                            <p><strong>Total Spending:</strong> ₹{calcSpent}</p>
                                            <p><strong>Budget Saved:</strong> ₹{calcSaved}</p>
                                        </>
                                    );
                                })()}
                                <p><strong>Distance Covered:</strong> {selectedTrip.distance || 0} km</p>
                            </div>
                            <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '20px' }}>
                                <h3 style={{ marginBottom: '1rem', color: '#2d3436' }}>🌟 Experience</h3>
                                <p><strong>Route:</strong> {selectedTrip.startPlace} → {selectedTrip.endPlace}</p>
                                <p><strong>Visited:</strong> {selectedTrip.placesVisited}</p>
                            </div>
                        </div>

                        {selectedTrip.imageUrls && selectedTrip.imageUrls.length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '1.5rem' }}>📸 Memories</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                    {selectedTrip.imageUrls.map((url, idx) => (
                                        <img key={idx} src={url} alt="Trip" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '15px' }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {selectedTrip.isAiGenerated ? (
                            <div className="ai-itinerary-history" style={{ 
                                marginTop: '2rem', 
                                padding: '2rem', 
                                background: '#fcfdfa', 
                                border: '1px solid #e1e8e3', 
                                borderRadius: '20px',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.02)'
                            }}>
                                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e6a3d' }}>
                                    <i className="fa-solid fa-wand-magic-sparkles"></i> AI Generated Itinerary
                                </h3>
                                <div 
                                    className="itinerary-content-rendered" 
                                    dangerouslySetInnerHTML={{ __html: selectedTrip.itineraryHtml }}
                                    style={{
                                        lineHeight: '1.7',
                                        color: '#334155'
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255, 69, 0, 0.05)', borderRadius: '15px' }}>
                                <h3 style={{ marginBottom: '0.5rem' }}>📝 Notes</h3>
                                <p>{selectedTrip.memories || "No specific memories recorded for this trip."}</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {isModalOpen && <AddTripModal onClose={handleCloseModal} onTripAdded={() => { }} tripToEdit={tripToEdit} />}
            <Footer />
        </div>
    );
};

export default TripHistory;
