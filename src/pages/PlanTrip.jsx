import React, { useEffect, useState } from 'react';
import { usePageTitle, usePageStyle, useScript } from '../hooks';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, increment } from 'firebase/firestore';

const PlanTrip = () => {
    usePageTitle('Tamil Nadu Travel Planner AI');
    usePageStyle('/ai api/style.css'); // Assuming style.css is in public/ai api/

    // Load libraries
    useScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
    useScript("https://cdn.jsdelivr.net/npm/marked/marked.min.js");

    const WEATHER_KEY = import.meta.env.WEATHER_API_KEY;


    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [outputHtml, setOutputHtml] = useState(null);
    const [rawMarkdown, setRawMarkdown] = useState('');
    const [weatherData, setWeatherData] = useState(null);
    const [weatherCity, setWeatherCity] = useState('');
    const [showDownload, setShowDownload] = useState(false);
    const [selectedDayToReplan, setSelectedDayToReplan] = useState('1');
    const [replanFeedback, setReplanFeedback] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Form State
    const [city, setCity] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [travelType, setTravelType] = useState('family');
    const [budget, setBudget] = useState('moderate');
    const [placeType, setPlaceType] = useState('mixed');
    const [customPrompt, setCustomPrompt] = useState('');

    const getDaysInRange = (start, end) => {
        const s = new Date(start),
            e = new Date(end);
        const days = [];
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) days.push(new Date(d));
        return days;
    };

    const getWeatherIcon = (desc) => {
        const d = desc.toLowerCase();
        if (d.includes('clear')) return 'fa-sun';
        if (d.includes('cloud')) return 'fa-cloud';
        if (d.includes('rain')) return 'fa-cloud-rain';
        if (d.includes('snow')) return 'fa-snowflake';
        if (d.includes('thunder')) return 'fa-bolt';
        if (d.includes('mist') || d.includes('fog')) return 'fa-smog';
        return 'fa-cloud-sun';
    };

    const renderWeatherSection = (summaries, cityName) => {
        if (!summaries || summaries.length === 0) return "";

        const cards = summaries.map(s => `
<div class="weather-card">
    <span class="date">Day ${s.day}</span>
    <i class="fa-solid ${getWeatherIcon(s.desc)} weather-icon"></i>
    <span class="temp">${Math.round(s.temp)}°C</span>
    <span class="desc">${s.desc}</span>
</div>`).join('');

        return `
<div class="weather-section">
    <h3><i class="fa-solid fa-cloud-sun"></i> Weather Forecast for ${cityName}</h3>
    <div class="weather-grid">
        ${cards}
    </div>
</div>`;
    };

    const sendToGemini = async (prompt) => {
        try {
            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gemini error");

            setRawMarkdown(data.text);
            const htmlContent = marked.parse(data.text);
            setOutputHtml(htmlContent);
            setShowDownload(true);
        } catch (e) {
            setOutputHtml(
                `<div class="placeholder-state" style="color:red">${e.message}</div>`
            );
        } finally {
            setLoading(false);
        }
    };


    const generatePlan = async () => {
        setOutputHtml(null); // Clear previous output
        setWeatherData(null);
        setIsSaved(false);

        if (!customPrompt) {
            if (!city) {
                setOutputHtml(`<div class="placeholder-state" style="color: var(--danger-color);"><i class="fa-solid fa-circle-exclamation"></i><p>Please enter a destination city.</p></div>`);
                return;
            }
            if (!startDate || !endDate) {
                setOutputHtml(`<div class="placeholder-state" style="color: var(--danger-color);"><i class="fa-solid fa-calendar-xmark"></i><p>Please select valid start and end dates.</p></div>`);
                return;
            }
        }

        setShowDownload(false);
        setLoading(true);
        setLoadingMsg("Fetching weather data...");

        if (customPrompt) {
            await sendToGemini(customPrompt);
            setLoading(false);
            return;
        }

        let weatherInfo = "";
        let dailySummaries = [];
        const days = getDaysInRange(startDate, endDate);

        // 1. Try to fetch weather
        try {
            setLoadingMsg("Checking forecast...");
            const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_KEY}&units=metric`);
            const weatherData = await weatherRes.json();

            if (weatherData.cod === "200") {
                const forecastMap = new Map();
                weatherData.list.forEach(e => {
                    const date = e.dt_txt.split(" ")[0];
                    if (!forecastMap.has(date)) forecastMap.set(date, e);
                });

                weatherInfo = `### Weather Forecast for ${city}\n`;
                days.forEach((d, i) => {
                    const ds = d.toISOString().split("T")[0];
                    const f = forecastMap.get(ds);
                    if (f) {
                        const desc = f.weather[0].description;
                        const temp = f.main.temp;
                        weatherInfo += `- **${d.toDateString()}**: ${desc}, ${temp}°C\n`;
                        dailySummaries.push({ day: i + 1, desc, temp, date: d.toDateString() });
                    }
                });
            } else {
                console.warn("Weather API Error:", weatherData.message);
            }
        } catch (wErr) {
            console.warn("Weather Fetch Failed (continuing without weather):", wErr);
        }

        // 2. Generate Plan with Gemini
        try {
            setLoadingMsg("Drafting your professional itinerary...");

            const weatherSection = dailySummaries.length > 0
                ? `**Weather Brief:**\n${dailySummaries.map(d => `Day ${d.day}: ${d.desc}, ${d.temp}°C`).join('; ')}`
                : "**Weather:** Data unavailable (pack for seasonal norms).";

            const prompt = `Create a short and simple ${days.length}-day Tamil Nadu travel plan for ${city} (${startDate} to ${endDate}).
            
            **Traveler Info:**
            - Category: ${travelType}
            - Budget: ${budget}
            - Interest: ${placeType}
            
            ${weatherSection}
            
            **Guidelines:**
            - Use very simple, friendly Indian English (easy to understand).
            - Keep it concise. No long paragraphs.
            - Focus on the best local experiences.

            **Format:**
            ## Quick Summary
            (2-3 lines about the trip)

            ## Daily Plan
            (For each day, use ## Day X header)
            - **Morning**: [Top 1-2 activities]
            - **Lunch**: [1 suggestion]
            - **Afternoon**: [1-2 activities]
            - **Evening**: [Best spot for dinner/relaxing]

            ## Logistics & Packing Essentials
            - Best way to travel between spots.
            - 2-3 essential items for the weather.

            **CRITICAL:** Ensure every section (Summary, Day X, Logistics) starts with a ## header.
            `;

            if (dailySummaries.length > 0) {
                setWeatherData(dailySummaries);
                setWeatherCity(city);
            }

            await sendToGemini(prompt);

        } catch (err) {
            console.error(err);
            setOutputHtml(`<div class="placeholder-state" style="color: var(--danger-color);"><i class="fa-solid fa-server"></i><p>Critical Error: ${err.message}</p></div>`);
        } finally {
            setLoading(false);
        }
    };

    const replanDay = async () => {
        if (!rawMarkdown) return;

        setLoading(true);
        setLoadingMsg(`Replanning Day ${selectedDayToReplan}...`);

        try {
            const prompt = `I have this travel itinerary for ${city}:
            
            ${rawMarkdown}
            
            **OBJECTIVE:**
            Please provide DIFFERENT activities for **Day ${selectedDayToReplan}**. 
            
            **Specific Feedback:**
            ${replanFeedback || "Suggest entirely new local experiences, hidden gems, or different spots than the ones currently listed."}
            
            **Format to return (START DIRECTLY WITH THE HEADER):**
            ## Day ${selectedDayToReplan}
            - **Morning**: [NEW activity 1-2]
            - **Lunch**: [NEW suggest 1]
            - **Afternoon**: [NEW activity 1-2]
            - **Evening**: [NEW best spot]
            
            **CRITICAL:**
            - Return ONLY the updated markdown for Day ${selectedDayToReplan}.
            - DO NOT return the full itinerary.
            - Ensure the activities are DIFFERENT from what is currently in Day ${selectedDayToReplan}.
            - Use the same simple, friendly Indian English style.
            `;

            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gemini error");

            let newDayContent = data.text.trim();
            // Remove markdown code block markers if Gemini included them
            newDayContent = newDayContent.replace(/^```markdown\n|```$/g, '').trim();

            // Surgical Swap logic using Regex
            const currentContent = rawMarkdown;
            const dayNum = selectedDayToReplan;

            // Look for ## Day {dayNum} followed by any content until we hit the next ## header OR the end of the string
            const dayRegex = new RegExp(`## Day ${dayNum}[\\s\\S]*?(?=(##|$))`, 'i');

            if (!dayRegex.test(currentContent)) {
                console.error("Content before regex fail:", currentContent);
                throw new Error(`Could not find the section for Day ${dayNum}. Please try generating a new plan.`);
            }

            const updatedMarkdown = currentContent.replace(dayRegex, newDayContent + "\n\n");

            setRawMarkdown(updatedMarkdown);
            setOutputHtml(marked.parse(updatedMarkdown));
            setReplanFeedback('');

        } catch (err) {
            console.error("Replan error:", err);
            alert(`Sorry, I couldn't update the plan: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        const element = document.getElementById("output");
        const cityName = city || "Itinerary";

        // Clone to styling for PDF (Light Mode)
        const clone = element.cloneNode(true);
        clone.style.background = "white";
        clone.style.color = "black";
        clone.style.padding = "40px";
        clone.style.width = "800px"; // Fixed width for A4 consistency
        clone.style.border = "none";

        // Fix Headers for PDF
        const headers = clone.querySelectorAll('h1, h2, h3, strong');
        headers.forEach(h => h.style.color = "#0f172a");

        // Fix Links
        const links = clone.querySelectorAll('a');
        links.forEach(l => l.style.color = "#2563eb");

        const opt = {
            margin: [10, 10],
            filename: `${cityName}_Travel_Plan.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            // eslint-disable-next-line no-undef
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // eslint-disable-next-line no-undef
        html2pdf().from(clone).set(opt).save();
    };

    const createGoogleCalendarUrl = (event) => {
        const start = event.start.dateTime.replace(/[-:]/g, '');
        const end = event.end.dateTime.replace(/[-:]/g, '');
        const details = encodeURIComponent(event.description || '');
        const location = encodeURIComponent(event.location || '');
        const summary = encodeURIComponent(event.summary || '');

        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${summary}&dates=${start}/${end}&details=${details}&location=${location}&trp=true`;
    };

    const generateCalendarEvents = async () => {
        console.log("!!! TRIGGERING GOOGLE CALENDAR SYNC MODAL !!!");
        if (!rawMarkdown) return;
        setIsExporting(true);
        setLoading(true);
        setLoadingMsg("Organizing your sync schedule...");

        try {
            const prompt = `You are a travel automation agent.

I will give you a travel itinerary in markdown format.
Your task is to convert it into a list of events.

### INPUTS
- City: ${city}
- Trip start date: ${startDate}
- Trip end date: ${endDate}
- Itinerary markdown:
${rawMarkdown}

### RULES
1. Create events ONLY for: Morning, Lunch, Afternoon, Evening.
2. Use realistic Indian travel times:
   - Morning: 09:00 – 11:30
   - Lunch: 13:00 – 14:00
   - Afternoon: 15:00 – 17:30
   - Evening: 18:30 – 20:30
3. Each event MUST include: summary, location, start.dateTime (YYYY-MM-DDTHH:mm:ss), end.dateTime (YYYY-MM-DDTHH:mm:ss), and description.
4. Output ONLY valid JSON:
{
  "events": [
    {
      "summary": "Meenakshi Temple Visit",
      "location": "Madurai",
      "description": "Explore the historic temple",
      "start": { "dateTime": "2026-01-10T09:00:00" },
      "end": { "dateTime": "2026-01-10T11:30:00" },
      "day": 1
    }
  ]
}
`;

            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gemini error");

            console.log("RAW AI RESPONSE FOR CALENDAR:", data.text);

            let jsonText = data.text.trim();
            // Robust extraction: find content between first { and last }
            const firstBrace = jsonText.indexOf('{');
            const lastBrace = jsonText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonText = jsonText.substring(firstBrace, lastBrace + 1);
            }

            try {
                const parsed = JSON.parse(jsonText);
                if (parsed.events && parsed.events.length > 0) {
                    setCalendarEvents(parsed.events);
                    setShowSyncModal(true);
                } else {
                    console.error("No events in parsed JSON:", parsed);
                    throw new Error("No events found in the itinerary.");
                }
            } catch (parseErr) {
                console.error("JSON Parse Error. Cleaned text:", jsonText);
                throw new Error("Could not understand the calendar data format from AI.");
            }
        } catch (err) {
            console.error("CALENDAR GENERATION FAILED:", err);
            alert(`Failed to organize calendar events: ${err.message}`);
        } finally {
            setLoading(false);
            setIsExporting(false);
        }
    };

    const saveTripToHistory = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("Please log in to save your trip.");
            return;
        }

        setIsSaving(true);
        try {
            let budgetVal = 15000;
            if (budget === 'cheap') budgetVal = 5000;
            else if (budget === 'luxury') budgetVal = 50000;

            const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) || 0;

            const getDestinationImage = (dest) => {
                const search = dest?.toLowerCase() || '';
                if (search.includes('ooty')) return 'https://images.unsplash.com/photo-1548013146-72479768b921?auto=format&fit=crop&w=1000&q=80';
                if (search.includes('kodai')) return 'https://images.unsplash.com/photo-1626014303757-64174d6f0285?auto=format&fit=crop&w=1000&q=80';
                if (search.includes('madurai')) return 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80';
                if (search.includes('chennai')) return 'https://images.unsplash.com/photo-1580619305218-8423a7f19bca?auto=format&fit=crop&w=1000&q=80';
                if (search.includes('kanni')) return 'https://images.unsplash.com/photo-1601000780131-7e8e19c063cf?auto=format&fit=crop&w=1000&q=80';
                if (search.includes('ramesh')) return 'https://images.unsplash.com/photo-1589136142558-1830f277053b?auto=format&fit=crop&w=1000&q=80';
                return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80';
            };

            const tripData = {
                title: `AI Trip to ${city || 'Destination'}`,
                destination: city || 'Destination',
                startDate: startDate || '',
                endDate: endDate || '',
                plannedBudget: budgetVal,
                actualExpenditure: 0,
                savings: budgetVal,
                transport: 'Car',
                startPlace: 'Home',
                endPlace: city || 'Destination',
                placesVisited: city || 'Destination',
                distance: 0,
                memories: rawMarkdown || '',
                itineraryHtml: outputHtml || '',
                isAiGenerated: true,
                coverImage: getDestinationImage(city),
                userId: user.uid,
                duration: duration,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Save to trips collection
            await addDoc(collection(db, 'users', user.uid, 'trips'), tripData);

            // Update user wallet summary
            const walletRef = doc(db, 'users', user.uid, 'wallet', 'summary');
            await setDoc(walletRef, {
                totalTrips: increment(1),
                totalBudget: increment(budgetVal),
                totalSpent: increment(0)
            }, { merge: true });

            setIsSaved(true);
            alert("Trip saved to your Adventure History!");
        } catch (err) {
            console.error("Error saving trip:", err);
            alert(`Failed to save trip: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("JSON copied to clipboard!");
        });
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="brand" onClick={() => window.location.href = '/home'}>
                    <i className="fa-solid fa-location-dot"></i>
                    <h1>TN.AI Planner</h1>
                    <div className="logo-bar"></div>
                </div>

                <div className="controls">
                    <div className="control-group">
                        <label htmlFor="cityInput"><i className="fa-solid fa-map-pin"></i> Destination</label>
                        <input
                            type="text"
                            id="cityInput"
                            placeholder="Where do you want to go?"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>
                    {outputHtml && (
                        <div className="control-group replan-section">
                            <label><i className="fa-solid fa-arrows-rotate"></i> Replan Specific Day</label>

                            <select
                                value={selectedDayToReplan}
                                onChange={(e) => setSelectedDayToReplan(e.target.value)}
                                style={{ width: '100%', marginBottom: '0.75rem' }}
                            >
                                {(startDate && endDate) ? getDaysInRange(startDate, endDate).map((_, i) => (
                                    <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                                )) : <option value="1">Day 1</option>}
                            </select>

                            <textarea
                                placeholder="Tell me what to change for this day... (e.g. 'less walking', 'more food')"
                                value={replanFeedback}
                                onChange={(e) => setReplanFeedback(e.target.value)}
                                rows="2"
                                style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}
                            ></textarea>

                            <button onClick={replanDay} className="action-btn" style={{ width: '100%', background: 'var(--accent-soft)', border: 'none', color: 'var(--accent-primary)', justifyContent: 'center' }}>
                                <i className="fa-solid fa-wand-magic-sparkles"></i> Update Day {selectedDayToReplan}
                            </button>
                        </div>
                    )}

                    <div className="control-row">
                        <div className="control-group">
                            <label htmlFor="startDate"><i className="fa-regular fa-calendar"></i> Start</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                placeholder="dd-mm-yyyy"
                            />
                        </div>
                        <div className="control-group">
                            <label htmlFor="endDate"><i className="fa-regular fa-calendar-check"></i> End</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                placeholder="dd-mm-yyyy"
                            />
                        </div>
                    </div>

                    <div className="control-group">
                        <label>Travelers</label>
                        <div className="select-grid" id="travelTypeOptions">
                            {['solo', 'partner', 'family', 'friends'].map(type => (
                                <button
                                    key={type}
                                    className={`select-btn ${travelType === type ? 'active' : ''}`}
                                    onClick={() => setTravelType(type)}
                                >
                                    <i className={`fa-solid ${type === 'solo' ? 'fa-person' : type === 'partner' ? 'fa-heart' : type === 'family' ? 'fa-users' : 'fa-user-group'}`}></i> {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="control-group">
                        <label>Budget</label>
                        <div className="select-grid" id="budgetOptions">
                            {[
                                { val: 'cheap', label: 'Budget', icon: '$' },
                                { val: 'moderate', label: 'Standard', icon: '$$' },
                                { val: 'luxury', label: 'Luxury', icon: '$$$' }
                            ].map(item => (
                                <button
                                    key={item.val}
                                    className={`select-btn ${budget === item.val ? 'active' : ''}`}
                                    onClick={() => setBudget(item.val)}
                                >
                                    <span>{item.icon}</span> {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="control-group">
                        <label>Interests</label>
                        <div className="select-grid" id="placeTypeOptions">
                            {[
                                { val: 'mixed', label: 'Mixed' },
                                { val: 'adventure', label: 'Adventure' },
                                { val: 'waterfall', label: 'Nature' },
                                { val: 'temple', label: 'Heritage' }
                            ].map(item => (
                                <button
                                    key={item.val}
                                    className={`select-btn ${placeType === item.val ? 'active' : ''}`}
                                    onClick={() => setPlaceType(item.val)}
                                >
                                    {item.val === 'mixed' && <i className="fa-solid fa-star" style={{ marginRight: '4px' }}></i>}
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="control-group">
                        <label htmlFor="customPrompt">Custom Requests</label>
                        <textarea
                            id="customPrompt"
                            rows="3"
                            placeholder="Specific requirements? (e.g., wheelchair access, vegan food)"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                        ></textarea>
                    </div>

                    <button onClick={generatePlan} className="generate-btn">
                        <i className="fa-solid fa-wand-magic-sparkles"></i> Generate Itinerary
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="result-header">
                    <h2>Your Itinerary</h2>
                    <div className="actions" style={{ display: 'flex', gap: '0.75rem' }}>
                        {showDownload && (
                            <>
                                <button onClick={saveTripToHistory} className="action-btn" disabled={isSaving || isSaved} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none' }}>
                                    <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : isSaved ? 'fa-circle-check' : 'fa-floppy-disk'}`}></i> {isSaved ? 'Saved to History' : isSaving ? 'Saving...' : 'Save Trip'}
                                </button>
                                <button onClick={generateCalendarEvents} className="action-btn" style={{ background: 'var(--primary-green)', color: 'white', border: 'none' }}>
                                    <i className="fa-solid fa-calendar-plus"></i> Add to Calendar
                                </button>
                                <button id="downloadBtn" onClick={downloadPDF} className="action-btn">
                                    <i className="fa-solid fa-file-pdf"></i> Download PDF
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div id="output" className="output-area">
                    {/* Corner Botanical Leaves */}
                    <svg className="decor-leaf top-right-leaf" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M160 0 C120 40, 80 80, 40 100" stroke="#6B7D72" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
                        <path d="M160 0 C135 15, 125 22, 115 15 C128 7, 142 4, 160 0 Z" fill="#2E8B57" opacity="0.15"/>
                        <path d="M135 22 C110 32, 100 40, 95 32 C104 25, 122 20, 135 22 Z" fill="#1E6A3D" opacity="0.12"/>
                        <path d="M115 42 C92 48, 82 56, 78 48 C87 40, 102 38, 115 42 Z" fill="#2E8B57" opacity="0.18"/>
                        <path d="M96 64 C75 66, 65 74, 61 66 C70 58, 83 60, 96 64 Z" fill="#1E6A3D" opacity="0.15"/>
                        <path d="M78 84 C60 84, 50 92, 46 84 C54 76, 67 78, 78 84 Z" fill="#2E8B57" opacity="0.2"/>
                    </svg>
                    <svg className="decor-leaf bottom-left-leaf" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 180 C40 140, 80 100, 100 60" stroke="#6B7D72" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
                        <path d="M0 180 C15 155, 22 145, 15 135 C7 148, 4 162, 0 180 Z" fill="#2E8B57" opacity="0.15"/>
                        <path d="M22 155 C32 130, 40 120, 32 115 C25 124, 20 142, 22 155 Z" fill="#1E6A3D" opacity="0.12"/>
                        <path d="M42 135 C48 112, 56 102, 48 98 C40 107, 38 122, 42 135 Z" fill="#2E8B57" opacity="0.18"/>
                        <path d="M64 116 C66 95, 74 85, 66 81 C58 90, 60 103, 64 116 Z" fill="#1E6A3D" opacity="0.15"/>
                        <path d="M84 98 C84 80, 92 70, 84 66 C76 74, 78 87, 84 98 Z" fill="#2E8B57" opacity="0.2"/>
                    </svg>
                    <svg className="decor-leaf bottom-right-leaf" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M180 180 C140 140, 100 100, 80 60" stroke="#6B7D72" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
                        <path d="M180 180 C165 155, 158 145, 165 135 C173 148, 176 162, 180 180 Z" fill="#2E8B57" opacity="0.15"/>
                        <path d="M158 155 C148 130, 140 120, 148 115 C155 124, 160 142, 158 155 Z" fill="#1E6A3D" opacity="0.12"/>
                        <path d="M138 135 C132 112, 124 102, 132 98 C140 107, 142 122, 138 135 Z" fill="#2E8B57" opacity="0.18"/>
                        <path d="M116 116 C114 95, 106 85, 114 81 C122 90, 120 103, 116 116 Z" fill="#1E6A3D" opacity="0.15"/>
                        <path d="M96 98 C96 80, 88 70, 96 66 C104 74, 102 87, 96 98 Z" fill="#2E8B57" opacity="0.2"/>
                    </svg>

                    {/* Bottom Layered Hills */}
                    <div className="decor-hills">
                        <svg viewBox="0 0 800 160" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="hillGradBack" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#EAF5E8" stopOpacity="0.4"/>
                                    <stop offset="100%" stopColor="#FAFBF8" stopOpacity="0.8"/>
                                </linearGradient>
                                <linearGradient id="hillGradFront" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#DDE8D9" stopOpacity="0.5"/>
                                    <stop offset="100%" stopColor="#EAF5E8" stopOpacity="0.9"/>
                                </linearGradient>
                            </defs>
                            <path d="M-50 160 C150 100, 250 120, 450 80 C650 40, 750 100, 850 160 Z" fill="url(#hillGradBack)"/>
                            <path d="M-50 160 C100 120, 300 90, 500 120 C700 150, 800 110, 850 160 Z" fill="url(#hillGradFront)"/>
                        </svg>
                    </div>

                    {loading ? (
                        <div className="loading">
                            <i className="fa-solid fa-circle-notch"></i>
                            <p>{loadingMsg}</p>
                        </div>
                    ) : (
                        (outputHtml || weatherData) ? (
                            <div className="output-area-content">
                                {weatherData && (
                                    <div className="weather-section">
                                        <h3><i className="fa-solid fa-cloud-sun"></i> Weather Forecast for {weatherCity}</h3>
                                        <div className="weather-grid">
                                            {weatherData.map((s, idx) => (
                                                <div key={idx} className="weather-card">
                                                    <span className="date">Day {s.day}</span>
                                                    <i className={`fa-solid ${getWeatherIcon(s.desc)} weather-icon`}></i>
                                                    <span className="temp">{Math.round(s.temp)}°C</span>
                                                    <span className="desc">{s.desc}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {outputHtml && <div dangerouslySetInnerHTML={{ __html: outputHtml }}></div>}
                            </div>
                        ) : (
                            <div className="placeholder-state">
                                <svg width="320" height="240" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="center-illustration">
                                    <defs>
                                        <linearGradient id="mountGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#E2EFE0" stopOpacity="0.8"/>
                                            <stop offset="100%" stopColor="#FAFBF8" stopOpacity="0.3"/>
                                        </linearGradient>
                                        <linearGradient id="mountGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#C5DFBF" stopOpacity="0.6"/>
                                            <stop offset="100%" stopColor="#EAF5E8" stopOpacity="0.2"/>
                                        </linearGradient>
                                        <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#A9D49E" stopOpacity="0.7"/>
                                            <stop offset="100%" stopColor="#EAF5E8" stopOpacity="0.4"/>
                                        </linearGradient>
                                        <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#8BBF80" stopOpacity="0.8"/>
                                            <stop offset="100%" stopColor="#C5DFBF" stopOpacity="0.3"/>
                                        </linearGradient>
                                        <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#1E6A3D" floodOpacity="0.15"/>
                                        </filter>
                                    </defs>
                                    <g opacity="0.7">
                                        <path d="M50 70 C50 60, 70 60, 80 65 C85 55, 105 55, 110 65 C120 65, 125 75, 115 80 C115 82, 50 82, 50 70 Z" fill="#FFFFFF" opacity="0.9"/>
                                        <path d="M220 50 C220 42, 235 42, 242 46 C246 38, 262 38, 266 46 C274 46, 278 54, 270 58 C270 60, 220 60, 220 50 Z" fill="#FFFFFF" opacity="0.8"/>
                                    </g>
                                    <g opacity="0.5">
                                        <path d="M110 45 C112 43, 115 45, 117 43 C119 45, 122 43, 124 45 C121 46, 113 46, 110 45 Z" fill="#6B7D72"/>
                                        <path d="M205 38 C207 36, 210 38, 212 36 C214 38, 217 36, 219 38 C216 39, 208 39, 205 38 Z" fill="#6B7D72"/>
                                    </g>
                                    <path d="M20 180 L110 90 L200 180 Z" fill="url(#mountGrad1)" />
                                    <path d="M120 180 L210 80 L300 180 Z" fill="url(#mountGrad1)" />
                                    <path d="M70 180 L160 105 L250 180 Z" fill="url(#mountGrad2)" />
                                    <path d="M-10 190 Q60 150 150 175 T330 160 L330 240 L-10 240 Z" fill="url(#hillGrad1)" />
                                    <path d="M-10 205 Q90 180 180 200 T330 190 L330 240 L-10 240 Z" fill="url(#hillGrad2)" />
                                    <g transform="translate(60, 155)" opacity="0.9">
                                        <line x1="0" y1="0" x2="0" y2="15" stroke="#1E6A3D" strokeWidth="2"/>
                                        <circle cx="0" cy="-3" r="7" fill="#2E8B57"/>
                                        <circle cx="-4" cy="-7" r="5" fill="#39A84A"/>
                                        <circle cx="4" cy="-7" r="5" fill="#22863A"/>
                                    </g>
                                    <g transform="translate(260, 165)" opacity="0.85">
                                        <line x1="0" y1="0" x2="0" y2="18" stroke="#1E6A3D" strokeWidth="2"/>
                                        <circle cx="0" cy="-4" r="9" fill="#1E6A3D"/>
                                        <circle cx="-5" cy="-8" r="6" fill="#2E8B57"/>
                                        <circle cx="5" cy="-8" r="6" fill="#39A84A"/>
                                    </g>
                                    <g transform="translate(100, 180)" opacity="0.9">
                                        <line x1="0" y1="0" x2="0" y2="12" stroke="#1E6A3D" strokeWidth="1.5"/>
                                        <circle cx="0" cy="-2" r="6" fill="#22863A"/>
                                    </g>
                                    <g transform="translate(160, 130)" filter="url(#pinShadow)">
                                        <ellipse cx="0" cy="22" rx="6" ry="2.5" fill="#1E6A3D" opacity="0.2"/>
                                        <path d="M0 20 C-15 5 -15 -10 0 -22 C15 -10 15 5 0 20 Z" fill="#2E8B57" stroke="#FFFFFF" strokeWidth="2"/>
                                        <circle cx="0" cy="-3" r="6" fill="#FFFFFF"/>
                                    </g>
                                </svg>
                                <p>Enter your trip details to generate a personalized AI travel plan.</p>
                            </div>
                        )
                    )}
                </div>
            </main>

            {showSyncModal && (
                <div className="modal-overlay" onClick={() => setShowSyncModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
                        <div className="modal-header">
                            <h3><i className="fa-solid fa-calendar-check"></i> Sync to Google Calendar</h3>
                            <button className="close-modal" onClick={() => setShowSyncModal(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="sync-list" style={{ maxHeight: '400px', overflowY: 'auto', padding: '1rem' }}>
                            {calendarEvents.map((event, idx) => (
                                <div key={idx} className="sync-item" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: 'var(--accent-soft)',
                                    borderRadius: '12px',
                                    marginBottom: '0.75rem',
                                    gap: '1rem',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{event.summary}</h4>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                <i className="fa-solid fa-calendar-day"></i> Day {event.day}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                <i className="fa-solid fa-clock"></i> {new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <a
                                        href={createGoogleCalendarUrl(event)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="action-btn"
                                        style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '0.6rem 1rem', fontSize: '0.85rem', textDecoration: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <i className="fa-solid fa-plus"></i> Add
                                    </a>
                                </div>
                            ))}
                        </div>
                        <div className="modal-actions" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                                <i className="fa-solid fa-circle-info"></i> Clicking "Add" will open a Google Calendar window. Click <strong>"Save"</strong> in that window to confirm.
                            </p>
                            <button className="action-btn" onClick={() => setShowSyncModal(false)} style={{ width: '100%', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-primary)', border: 'none' }}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanTrip;
