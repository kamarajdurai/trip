import React from 'react';
import './NeumorphicButtons.css';

const NeumorphicButtons = () => {
  return (
    <div className="neumorphic-wrapper">
      <button className="neu-btn vr-btn">
        {/* Minimal VR Headset icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="neu-icon">
          <path d="M22.5 7.5h-21A1.5 1.5 0 0 0 0 9v6a1.5 1.5 0 0 0 1.5 1.5h4.15l1.65 3h4.4l1.65-3h4.15A1.5 1.5 0 0 0 24 15V9a1.5 1.5 0 0 0-1.5-1.5zm-15 6a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5zm9 0a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5z" />
        </svg>
        VR
      </button>

      <button className="neu-btn ar-btn">
        {/* Minimal 3D Cube icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="neu-icon">
          <path d="M12.98 2.067a2 2 0 00-1.96 0L3.03 6.07C2.39 6.4 2 7.076 2 7.8v8.4c0 .724.39 1.4 1.03 1.73l7.99 4.003a2 2 0 001.96 0l7.99-4.004A1.996 1.996 0 0022 16.201V7.8c0-.724-.39-1.4-1.03-1.73L12.98 2.067zM11 20.375V12.18l-8-4V16.2l8 4.175zm2 0l8-4.175V8.18l-8 4v8.195zM4.195 7.042L12 3.14l7.805 3.903-7.805 3.903-7.805-3.904z" />
        </svg>
        AR
      </button>
    </div>
  );
};

export default NeumorphicButtons;
