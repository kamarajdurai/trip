// HospitalBooking.jsx
import React from 'react';

const HospitalBooking = ({ place, onBack }) => {
  const imageUrl = place?.photos?.[0]?.getUrl() || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800';

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Appointment confirmed at ' + place.name);
    onBack();
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col py-8 pb-20">
      <div className="w-full">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="mb-6 flex left text-primary hover:text-primary-container transition-colors"
        >
          ← Back to Search
        </button>

        {/* Brand Header (Mini) */}
        <div className="flex justify-center mb-10">
          <div className="text-2xl font-bold tracking-tighter text-primary">Clinical Curator</div>
        </div>

        {/* Hospital Summary Hero Card */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest mb-10 shadow-[0_12px_40px_rgba(7,30,39,0.06)]">
          <div className="md:flex">
            <div className="md:w-1/3 h-64 md:h-auto overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt={place.name} 
                src={imageUrl} 
              />
            </div>
            <div className="p-8 md:w-2/3 flex flex-col justify-center text-left">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-[0.6875rem] font-bold tracking-wider uppercase">
                  Accredited Partner
                </span>
                {place.rating && (
                  <div className="flex items-center text-primary text-sm font-semibold">
                    ⭐ {place.rating} / 5
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-2">
                {place.name}
              </h1>
              <p className="text-on-surface-variant text-base mb-6 leading-relaxed">
                Premier destination for advanced medical excellence. Providing world-class patient care.
              </p>
              <div className="flex flex-wrap gap-6 text-sm text-on-surface-variant font-medium">
                <div className="flex items-center gap-2">
                  📍 {place.formatted_address}
                </div>
                <div className="flex items-center gap-2">
                  ✔️ Verified Partner
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Form Container */}
        <div className="bg-surface-container-low rounded-xl p-8 md:p-12 text-left">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-primary mb-3">Schedule Your Consultation</h2>
            <p className="text-on-surface-variant">Fill in the details below to request a prioritized appointment slot with our world-renowned specialists.</p>
          </div>
          
          <form className="space-y-12" onSubmit={handleSubmit}>
            {/* Patient Information Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  👤
                </span>
                <h3 className="text-xl font-bold tracking-tight text-on-surface">Patient Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[0.6875rem] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Patient Name</label>
                  <input required className="bg-surface-container-lowest border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface" placeholder="Full Legal Name" type="text"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.6875rem] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Age</label>
                    <input required className="bg-surface-container-lowest border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface" placeholder="Years" type="number" min="0"/>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[0.6875rem] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Gender</label>
                    <select required className="bg-surface-container-lowest border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface appearance-none">
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[0.6875rem] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="bg-surface-container-lowest px-4 py-4 rounded-xl text-on-surface-variant flex items-center font-medium">+91</span>
                    <input required className="flex-grow bg-surface-container-lowest border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface" placeholder="Phone number" type="tel"/>
                  </div>
                </div>
              </div>
            </section>

            {/* Medical Selection Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  ⚕️
                </span>
                <h3 className="text-xl font-bold tracking-tight text-on-surface">Specialization & Doctor</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[0.6875rem] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Select Department</label>
                  <select required className="bg-surface-container-lowest border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface appearance-none">
                    <option value="">Select</option>
                    <option>Cardiology</option>
                    <option>Neurology</option>
                    <option>Oncology</option>
                    <option>Orthopedics</option>
                    <option>General Medicine</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[0.6875rem] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Select Doctor</label>
                  <select required className="bg-surface-container-lowest border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface appearance-none">
                    <option value="">Select</option>
                    <option>Dr. Elena Fischer - Sr. Cardiologist</option>
                    <option>Dr. Marc Weber - Cardiovascular Surgeon</option>
                    <option>Dr. Sophia Schneider - Heart Rhythm Specialist</option>
                    <option>Dr. Ramesh Kumar - General</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Scheduling Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  📅
                </span>
                <h3 className="text-xl font-bold tracking-tight text-on-surface">Appointment Slot</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 flex flex-col gap-2">
                  <label className="text-[0.6875rem] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Appointment Date</label>
                  <input required className="bg-surface-container-lowest border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface" type="date"/>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-2">
                  <label className="text-[0.6875rem] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Preferred Time</label>
                  <select required className="bg-surface-container-lowest border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface appearance-none">
                    <option value="">Select a time</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:30">01:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-outline-variant/20">
              <div className="flex items-start gap-4 max-w-md">
                <span className="text-primary mt-1">ℹ️</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  By clicking book, you agree to the medical tourism terms of service and consent to the hospital contacting you via the provided mobile number.
                </p>
              </div>
              <button className="w-full md:w-auto px-10 py-5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-lg shadow-[0_8px_24px_rgba(3,97,101,0.2)] hover:shadow-[0_12px_32px_rgba(3,97,101,0.3)] transition-all transform active:scale-95" type="submit">
                Confirm Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HospitalBooking;
