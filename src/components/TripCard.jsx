import React from 'react';

const TripCard = ({ trip, onExplore, onEdit, onDelete }) => {
    return (
        <div className="trip-card">
            <div className="trip-card-image" style={{ backgroundImage: `url(${trip.coverImage || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80'})` }}>
                {trip.isAiGenerated && (
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'linear-gradient(135deg, #810000 0%, #a30808 100%)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                        <i className="fa-solid fa-wand-magic-sparkles"></i> AI Plan
                    </div>
                )}
                <div className="trip-card-overlay-actions">
                    <button className="icon-btn edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit Trip">
                        <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button className="icon-btn delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete Trip">
                        <i className="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            <div className="trip-card-content" onClick={() => onExplore(trip)}>
                <h3 className="trip-card-title">{trip.title}</h3>
                <p style={{ color: '#800020', fontWeight: '600', marginBottom: '8px' }}>{trip.destination}</p>
                <div className="trip-card-info">
                    <span><i className="fa-solid fa-calendar"></i> {trip.startDate || 'Upcoming'}</span>
                    <span><i className="fa-solid fa-indian-rupee-sign"></i> {trip.plannedBudget || trip.actualExpenditure || 0}</span>
                </div>
                <div className="trip-card-actions">
                    <button className="btn-explore" style={{ width: '100%', justifyContent: 'center' }}>
                        View Adventure <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TripCard;
