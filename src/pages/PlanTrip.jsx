import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePageTitle, useScript } from '../hooks';
import './PlanTrip.css';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, setDoc, increment } from 'firebase/firestore';
import { 
    detectCulturalFestivals, 
    getTempleIntelligence, 
    getCulinaryMatches, 
    getAgriMatches, 
    getMatchedGuides, 
    buildCulturalPromptInstructions 
} from '../data/travelIntelligence';

const parseMarkdown = (text) => {
    if (typeof window !== 'undefined' && window.marked && typeof window.marked.parse === 'function') {
        return window.marked.parse(text);
    }
    return text;
};

const PlanTrip = () => {
    usePageTitle('Tamil Nadu Travel Planner AI');
    const location = useLocation();
    const navigate = useNavigate();

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Load libraries
    useScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
    useScript("https://cdn.jsdelivr.net/npm/marked/marked.min.js");

    const WEATHER_KEY = import.meta.env.VITE_WEATHER_API_KEY || "b2c5b477f503ea54bffa1455a210ff49";

    const [currentUser, setCurrentUser] = useState(auth.currentUser);
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
    const [isSaved, setIsSaved] = useState(false);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [savedTripId, setSavedTripId] = useState(null);

    // Cultural & Cross-Module Intelligence State
    const [detectedFestivals, setDetectedFestivals] = useState([]);
    const [templeIntel, setTempleIntel] = useState(null);
    const [culinaryHighlight, setCulinaryHighlight] = useState(null);
    const [agriHighlight, setAgriHighlight] = useState(null);
    const [matchedGuides, setMatchedGuides] = useState([]);

    // Form State (Default values aligned with screenshots)
    const [city, setCity] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [travelType, setTravelType] = useState('family'); // Screenshot shows 'Family' active
    const [budget, setBudget] = useState('moderate');       // Screenshot shows '$$ Standard' active
    const [placeType, setPlaceType] = useState('mixed');    // Screenshot shows '★ Mixed' active
    const [customPrompt, setCustomPrompt] = useState('');
    const [showCustomPrompt, setShowCustomPrompt] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (location.state?.destination) {
            setCity(location.state.destination);
        }
    }, [location.state]);

    // Dynamically update cultural intelligence as user changes inputs
    useEffect(() => {
        if (city) {
            setTempleIntel(getTempleIntelligence(city, placeType));
            setCulinaryHighlight(getCulinaryMatches(city));
            setAgriHighlight(getAgriMatches(city));
            setMatchedGuides(getMatchedGuides(city));
        }
        if (startDate) {
            setDetectedFestivals(detectCulturalFestivals(city, startDate, endDate));
        }
    }, [city, startDate, endDate, placeType]);

    const getDaysInRange = (start, end) => {
        const s = new Date(start),
            e = new Date(end);
        const days = [];
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) days.push(new Date(d));
        return days;
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return 'dd-mm-yyyy';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
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
            const htmlContent = parseMarkdown(data.text);
            setOutputHtml(htmlContent);
            setShowDownload(true);
            await saveOrUpdateTrip(data.text, htmlContent);
        } catch (e) {
            setOutputHtml(
                `<div style="color:#b91c1c; padding: 20px; font-weight:600;">${e.message}</div>`
            );
        } finally {
            setLoading(false);
        }
    };

    const getRealisticWeatherForDay = (city, dateObj, dayIdx, forecastItem, citySunrise) => {
        const cityNameLower = (city || '').toLowerCase();
        const isHillStation = ['ooty', 'kodaikanal', 'coonoor', 'valparai', 'yercaud', 'kotagiri', 'megamalai', 'kolli'].some(h => cityNameLower.includes(h));
        const isCoastal = ['chennai', 'mahabalipuram', 'rameswaram', 'kanyakumari', 'pondicherry', 'puducherry', 'tuticorin', 'thoothukudi', 'nagapattinam'].some(c => cityNameLower.includes(c));

        let temp, feelsLike, humidity, windSpeed, rainChance, desc, main, sunrise;

        if (forecastItem) {
            temp = Math.round(forecastItem.main.temp);
            feelsLike = Math.round(forecastItem.main.feels_like || temp + 2);
            humidity = forecastItem.main.humidity || (isHillStation ? 78 : 65);
            windSpeed = Math.round((forecastItem.wind?.speed || 3) * 3.6);
            rainChance = Math.round((forecastItem.pop !== undefined ? forecastItem.pop : (forecastItem.weather[0].main.toLowerCase().includes('rain') ? 0.7 : 0.15)) * 100);
            main = forecastItem.weather[0].main;
            desc = forecastItem.weather[0].description;
        } else {
            if (isHillStation) {
                temp = 16 + (dayIdx % 4);
                feelsLike = temp - 1;
                humidity = 75 + (dayIdx % 15);
                windSpeed = 8 + (dayIdx % 6);
                rainChance = 30 + (dayIdx % 40);
                main = dayIdx % 3 === 0 ? "Rain" : dayIdx % 3 === 1 ? "Clouds" : "Mist";
                desc = dayIdx % 3 === 0 ? "Light Rain" : dayIdx % 3 === 1 ? "Overcast Clouds" : "Misty Morning";
            } else if (isCoastal) {
                temp = 28 + (dayIdx % 3);
                feelsLike = temp + 4;
                humidity = 68 + (dayIdx % 10);
                windSpeed = 12 + (dayIdx % 8);
                rainChance = 10 + (dayIdx % 20);
                main = "Clear";
                desc = "Sunny & Breezy";
            } else {
                temp = 26 + (dayIdx % 4);
                feelsLike = temp + 2;
                humidity = 60 + (dayIdx % 12);
                windSpeed = 10 + (dayIdx % 5);
                rainChance = 15 + (dayIdx % 25);
                main = dayIdx % 2 === 0 ? "Clear" : "Clouds";
                desc = dayIdx % 2 === 0 ? "Sunny" : "Scattered Clouds";
            }
        }

        const formattedDesc = desc
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        let weatherType = 'sunny';
        let bgImage = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop';
        let weatherTip = 'Great day for exploring outdoor sights! Stay hydrated and wear comfortable walking shoes.';

        const dLower = desc.toLowerCase();
        if (dLower.includes('rain') || dLower.includes('drizzle') || dLower.includes('shower') || main === 'Rain') {
            weatherType = 'rain';
            bgImage = 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=800&auto=format&fit=crop';
            weatherTip = 'Expect refreshing showers. Keep a compact umbrella handy and enjoy cozy tea garden cafes!';
        } else if (dLower.includes('mist') || dLower.includes('fog') || dLower.includes('haze')) {
            weatherType = 'mist';
            bgImage = 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=800&auto=format&fit=crop';
            weatherTip = 'Misty dawn ahead. Perfect for valley viewpoints and sunrise photography!';
        } else if (dLower.includes('cloud') || dLower.includes('overcast') || main === 'Clouds') {
            weatherType = 'clouds';
            bgImage = 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=800&auto=format&fit=crop';
            weatherTip = 'Pleasant cloud cover keeps temperatures mild. Ideal for heritage tours and walking trails.';
        } else {
            weatherType = 'sunny';
            bgImage = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop';
            weatherTip = 'Bright sunshine expected. Carry sunglasses, sunscreen, and breathable cotton clothing.';
        }

        sunrise = citySunrise || '6:14 AM';
        const relativeDay = dayIdx === 0
            ? 'Today'
            : dayIdx === 1
                ? 'Tomorrow'
                : dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

        return {
            day: dayIdx + 1,
            relativeDay,
            formattedDate: dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
            temp,
            feelsLike,
            humidity,
            windSpeed,
            rainChance,
            sunrise,
            desc: formattedDesc,
            weatherType,
            bgImage,
            weatherTip
        };
    };

    const generatePlan = async () => {
        setOutputHtml(null);
        setWeatherData(null);
        setIsSaved(false);
        setSavedTripId(null);

        if (!customPrompt) {
            if (!city) {
                alert("Please enter a destination city.");
                return;
            }
            if (!startDate || !endDate) {
                alert("Please select valid start and end dates.");
                return;
            }
        }

        setShowDownload(false);
        setLoading(true);
        setLoadingMsg("Consulting Tamil Nadu cultural & climate intelligence...");

        if (customPrompt) {
            await sendToGemini(customPrompt);
            setLoading(false);
            return;
        }

        let dailySummaries = [];
        const days = getDaysInRange(startDate, endDate);
        let citySunrise = '6:14 AM';

        try {
            setLoadingMsg("Checking live weather forecast...");
            const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_KEY}&units=metric`);
            const data = await weatherRes.json();

            if (data.cod === "200") {
                if (data.city?.sunrise) {
                    citySunrise = new Date(data.city.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                const forecastMap = new Map();
                data.list.forEach(e => {
                    const date = e.dt_txt.split(" ")[0];
                    if (!forecastMap.has(date)) forecastMap.set(date, e);
                });

                days.forEach((d, i) => {
                    const ds = d.toISOString().split("T")[0];
                    const f = forecastMap.get(ds);
                    const dayWeather = getRealisticWeatherForDay(city, d, i, f, citySunrise);
                    dailySummaries.push(dayWeather);
                });
            } else {
                days.forEach((d, i) => {
                    const dayWeather = getRealisticWeatherForDay(city, d, i, null, citySunrise);
                    dailySummaries.push(dayWeather);
                });
            }
        } catch (wErr) {
            console.warn("Weather Fetch Failed (using regional realistic climate models):", wErr);
            days.forEach((d, i) => {
                const dayWeather = getRealisticWeatherForDay(city, d, i, null, citySunrise);
                dailySummaries.push(dayWeather);
            });
        }

        try {
            setLoadingMsg("Designing your personalized day-by-day itinerary...");

            const activeFestivals = detectCulturalFestivals(city, startDate, endDate);
            const activeTemple = getTempleIntelligence(city, placeType);
            const activeCulinary = getCulinaryMatches(city);
            const activeAgri = getAgriMatches(city);
            const activeGuides = getMatchedGuides(city);

            setDetectedFestivals(activeFestivals);
            setTempleIntel(activeTemple);
            setCulinaryHighlight(activeCulinary);
            setAgriHighlight(activeAgri);
            setMatchedGuides(activeGuides);

            const culturalInstructions = buildCulturalPromptInstructions(city, startDate, endDate, placeType);
            const weatherSection = dailySummaries.length > 0
                ? `**Weather Brief:**\n${dailySummaries.map(d => `Day ${d.day}: ${d.desc}, ${d.temp}°C (Humidity: ${d.humidity}%, Rain Chance: ${d.rainChance}%)`).join('; ')}`
                : "**Weather:** Data unavailable (pack for seasonal norms).";

            const prompt = `Create a culturally authentic ${days.length}-day Tamil Nadu travel itinerary for ${city} (${startDate} to ${endDate}).
            
            **Traveler Profile:**
            - Category: ${travelType}
            - Budget: ${budget}
            - Interest: ${placeType}
            
            ${weatherSection}
            
            ${culturalInstructions}
            
            **Guidelines:**
            - Use very simple, friendly Indian English (easy to understand).
            - Keep it concise, high-value, and culturally accurate.
            - STRICT TEMPLE TIMING: Temples close between 12:30 PM and 4:00 PM for Uchikala Pooja. Schedule temple visits in the Morning (06:30 - 11:30) or Evening (16:30 - 20:30) to avoid scorching stone floors.
            - For Midday (12:30 - 15:30), schedule authentic regional food (banana leaf meals/local specialties) followed by indoor AC museums or silk/handicraft shopping.
            - Under each day's Lunch and Dinner, explicitly name authentic native food specialties.

            **Format:**
            ## Quick Summary
            (2-3 lines about the journey, key highlights, and cultural essence)

            ## Daily Plan
            (For each day, strictly use ## Day X header)
            - **Morning (06:30 - 11:30)**: [1-2 activities; temples before heat or plantation walk]
            - **Lunch & Midday Pause (12:30 - 15:30)**: [Iconic native dishes + indoor museum/cultural shopping]
            - **Afternoon & Evening (16:00 - 20:30)**: [Temple deeparadhana, scenic viewpoints, or vibrant evening street food]
            - **Cultural & Attire Note**: [Dress code recommendations or mobile locker tips]

            ## Logistics & Packing Essentials
            - Best way to travel between spots.
            - 2-3 essential items (e.g. traditional attire for temples, thick socks for sunny stone floors, weather gear).

            **CRITICAL:** Ensure every section (Summary, Day X, Logistics) starts with a ## header.
            `;

            if (dailySummaries.length > 0) {
                setWeatherData(dailySummaries);
                setWeatherCity(city);
            }

            await sendToGemini(prompt);
        } catch (err) {
            console.error("Plan Generation Error:", err);
            setOutputHtml(`<div style="color:red; padding: 20px;">${err.message}</div>`);
            setLoading(false);
        }
    };

    const replanDay = async () => {
        if (!selectedDayToReplan) {
            alert("Please select a day to replan.");
            return;
        }

        setLoading(true);
        setLoadingMsg(`Replanning Day ${selectedDayToReplan}...`);

        try {
            const prompt = `You are a Tamil Nadu travel expert assistant.
            The user wants to REPLAN Day ${selectedDayToReplan} of their itinerary for ${city}.
            
            **Current Full Itinerary (Markdown):**
            ${rawMarkdown}
            
            **User's feedback / request for Day ${selectedDayToReplan}:**
            "${replanFeedback || 'Please provide fresh alternative spots and activities for this day.'}"
            
            **Format to return (START DIRECTLY WITH THE HEADER):**
            ## Day ${selectedDayToReplan}
            - **Morning (06:30 - 11:30)**: [NEW activity 1-2]
            - **Lunch & Midday Pause (12:30 - 15:30)**: [NEW authentic food suggestion & indoor craft/museum during temple closure]
            - **Afternoon & Evening (16:00 - 20:30)**: [NEW evening spot or temple deeparadhana]
            - **Cultural & Attire Note**: [Dress code or local tips]
            
            **CRITICAL:**
            - Return ONLY the updated markdown for Day ${selectedDayToReplan}.
            - STRICTLY respect temple midday closure (12:30 - 4:00 PM).
            - DO NOT return the full itinerary.
            - Ensure the activities are DIFFERENT from what is currently in Day ${selectedDayToReplan}.
            `;

            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gemini error");

            let newDayContent = data.text.trim();
            newDayContent = newDayContent.replace(/^```markdown\n|```$/g, '').trim();

            const currentContent = rawMarkdown;
            const dayNum = selectedDayToReplan;
            const dayRegex = new RegExp(`## Day ${dayNum}[\\s\\S]*?(?=(##|$))`, 'i');

            if (!dayRegex.test(currentContent)) {
                throw new Error(`Could not find the section for Day ${dayNum}.`);
            }

            const updatedMarkdown = currentContent.replace(dayRegex, newDayContent + "\n\n");
            setRawMarkdown(updatedMarkdown);
            const newHtml = parseMarkdown(updatedMarkdown);
            setOutputHtml(newHtml);
            setReplanFeedback('');
            await saveOrUpdateTrip(updatedMarkdown, newHtml);

        } catch (err) {
            console.error("Replan error:", err);
            alert(`Sorry, I couldn't update the plan: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        const element = document.getElementById("itineraryOutputTarget");
        if (!element) return;
        const cityName = city || "Itinerary";

        const clone = element.cloneNode(true);
        clone.style.background = "white";
        clone.style.color = "black";
        clone.style.padding = "40px";
        clone.style.width = "800px";
        clone.style.border = "none";

        const headers = clone.querySelectorAll('h1, h2, h3, strong');
        headers.forEach(h => h.style.color = "#1b4332");

        const opt = {
            margin: [10, 10],
            filename: `${cityName}_Tamil_Nadu_Travel_Plan.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            // eslint-disable-next-line no-undef
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // eslint-disable-next-line no-undef
        if (typeof html2pdf !== 'undefined') {
            // eslint-disable-next-line no-undef
            html2pdf().from(clone).set(opt).save();
        } else {
            window.print();
        }
    };

    const createGoogleCalendarUrl = (event) => {
        const start = event.start.dateTime.replace(/[-:]/g, '');
        const end = event.end.dateTime.replace(/[-:]/g, '');
        const details = encodeURIComponent(event.description || '');
        const locationStr = encodeURIComponent(event.location || '');
        const summary = encodeURIComponent(event.summary || '');

        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${summary}&dates=${start}/${end}&details=${details}&location=${locationStr}&trp=true`;
    };

    const generateCalendarEvents = async () => {
        if (!rawMarkdown) return;
        setIsExporting(true);
        setLoading(true);
        setLoadingMsg("Organizing your sync schedule...");

        try {
            const prompt = `You are a travel automation agent.
            Convert this markdown travel itinerary into an events schedule.
            
            - City: ${city}
            - Trip start date: ${startDate}
            - Trip end date: ${endDate}
            - Itinerary:
            ${rawMarkdown}
            
            Create events for Morning, Lunch, Afternoon, Evening with realistic times.
            Output ONLY valid JSON:
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
            }`;

            const res = await fetch("/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gemini error");

            let jsonText = data.text.trim();
            const firstBrace = jsonText.indexOf('{');
            const lastBrace = jsonText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonText = jsonText.substring(firstBrace, lastBrace + 1);
            }

            const parsed = JSON.parse(jsonText);
            if (parsed.events && parsed.events.length > 0) {
                setCalendarEvents(parsed.events);
                setShowSyncModal(true);
            } else {
                throw new Error("No events found in the itinerary.");
            }
        } catch (err) {
            console.error("CALENDAR GENERATION FAILED:", err);
            alert(`Failed to organize calendar events: ${err.message}`);
        } finally {
            setLoading(false);
            setIsExporting(false);
        }
    };

    const saveOrUpdateTrip = async (markdownText, htmlContent) => {
        const user = currentUser || auth.currentUser;
        if (!user) return;

        try {
            let budgetVal = 15000;
            if (budget === 'cheap') budgetVal = 5000;
            else if (budget === 'luxury') budgetVal = 50000;

            const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) || 1;

            const tripData = {
                title: `AI Trip to ${city || 'Destination'}`,
                destination: city || 'Destination',
                startDate: startDate || new Date().toISOString().split('T')[0],
                endDate: endDate || startDate || new Date().toISOString().split('T')[0],
                plannedBudget: budgetVal,
                actualExpenditure: 0,
                savings: budgetVal,
                transport: travelType === 'solo' ? 'Bike / Public Transport' : 'Car / Train',
                startPlace: 'Tamil Nadu',
                endPlace: city || 'Destination',
                placesVisited: city || 'Destination',
                distance: 150,
                memories: markdownText || '',
                itineraryHtml: htmlContent || '',
                isAiGenerated: true,
                coverImage: '/where-to-go/meenakshi.jpg',
                userId: user.uid,
                duration: duration > 0 ? duration : 1,
                updatedAt: serverTimestamp()
            };

            const walletRef = doc(db, 'users', user.uid, 'wallet', 'summary');

            if (savedTripId) {
                await setDoc(doc(db, 'users', user.uid, 'trips', savedTripId), tripData, { merge: true });
            } else {
                tripData.createdAt = serverTimestamp();
                const docRef = await addDoc(collection(db, 'users', user.uid, 'trips'), tripData);
                setSavedTripId(docRef.id);
                setIsSaved(true);

                await setDoc(walletRef, {
                    totalTrips: increment(1),
                    totalBudget: increment(budgetVal),
                    totalSpent: increment(0),
                    ecopoints: increment(50)
                }, { merge: true });
            }
        } catch (err) {
            console.error("Error auto-saving trip:", err);
        }
    };

    return (
        <div className="app-container">
            {/* ── Mobile Top Header (Visible only on mobile screens < 900px) ── */}
            <header className="mob-header-bar">
                <div className="mob-brand-text">
                    <span className="mob-brand-title">Tamil Nadu</span>
                    <span className="mob-brand-sub">Tourism</span>
                </div>
                <img 
                    src="/mob_header_gopuram.png" 
                    alt="Tamil Nadu Gopuram" 
                    className="mob-header-graphic" 
                />
            </header>

            {/* ── Left Sidebar / Form Card ── */}
            <aside className="sidebar-card">
                {/* Card Header: Compass badge + Titles */}
                <div className="card-header-row">
                    <div className="compass-badge">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="2" fill="none"/>
                            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#ffffff" stroke="#ffffff"/>
                        </svg>
                    </div>
                    <div className="card-title-group">
                        <h1 className="card-main-title">Your Itinerary</h1>
                        <p className="card-subtitle">Plan your perfect journey</p>
                        <div className="card-header-underline"></div>
                    </div>
                </div>

                {/* Back to Home Link */}
                <button 
                    onClick={() => navigate('/home')} 
                    className="back-home-btn"
                >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Back to Home</span>
                </button>

                {/* Form Controls */}
                <div className="controls-wrap">
                    {/* Destination Input Pill */}
                    <div className="search-input-pill">
                        <i className="fa-solid fa-location-dot search-pin-icon"></i>
                        <input
                            type="text"
                            id="cityInput"
                            placeholder="Where do you want to go?"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="search-input-field"
                        />
                        <i 
                            className="fa-solid fa-magnifying-glass search-mag-icon"
                            onClick={generatePlan}
                        ></i>
                    </div>

                    {/* Start and End Date Row */}
                    <div className="dates-control-grid">
                        {/* Start Date */}
                        <div className="date-column">
                            <div className="date-label-row">
                                <i className="fa-regular fa-calendar"></i>
                                <span>Start</span>
                            </div>
                            <div 
                                className="date-input-pill"
                                onClick={() => {
                                    if (startDateRef.current) {
                                        if (typeof startDateRef.current.showPicker === 'function') {
                                            startDateRef.current.showPicker();
                                        } else {
                                            startDateRef.current.focus();
                                        }
                                    }
                                }}
                            >
                                <span className={`date-display-val ${!startDate ? 'empty' : ''}`}>
                                    {startDate ? formatDisplayDate(startDate) : 'dd-mm-yyyy'}
                                </span>
                                <i className="fa-solid fa-chevron-down date-chevron"></i>
                                <input
                                    ref={startDateRef}
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="sr-date-native"
                                />
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="date-column">
                            <div className="date-label-row">
                                <i className="fa-regular fa-calendar-check"></i>
                                <span>End</span>
                            </div>
                            <div 
                                className="date-input-pill"
                                onClick={() => {
                                    if (endDateRef.current) {
                                        if (typeof endDateRef.current.showPicker === 'function') {
                                            endDateRef.current.showPicker();
                                        } else {
                                            endDateRef.current.focus();
                                        }
                                    }
                                }}
                            >
                                <span className={`date-display-val ${!endDate ? 'empty' : ''}`}>
                                    {endDate ? formatDisplayDate(endDate) : 'dd-mm-yyyy'}
                                </span>
                                <i className="fa-solid fa-chevron-down date-chevron"></i>
                                <input
                                    ref={endDateRef}
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="sr-date-native"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Travellers Section */}
                    <div>
                        <div className="section-label">
                            <i className="fa-solid fa-user"></i>
                            <span>Travellers</span>
                        </div>
                        <div className="pills-row">
                            {[
                                { id: 'solo', label: 'Solo', icon: 'fa-user' },
                                { id: 'partner', label: 'Partner', icon: 'fa-user-group' },
                                { id: 'family', label: 'Family', icon: 'fa-users' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`pill-btn ${travelType === item.id ? 'active-solid' : ''}`}
                                    onClick={() => setTravelType(item.id)}
                                >
                                    <i className={`fa-solid ${item.icon}`}></i>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget Section */}
                    <div>
                        <div className="section-label">
                            <i className="fa-solid fa-wallet"></i>
                            <span>Budget</span>
                        </div>
                        <div className="pills-row">
                            {[
                                { id: 'cheap', label: 'Budget', icon: 'fa-arrow-down-to-bracket' },
                                { id: 'moderate', label: 'Standard', prefix: '$$' },
                                { id: 'luxury', label: 'Luxury', prefix: '$$' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`pill-btn ${budget === item.id ? 'active-outline' : ''}`}
                                    onClick={() => setBudget(item.id)}
                                >
                                    {item.icon && <i className={`fa-solid ${item.icon}`}></i>}
                                    {item.prefix && <span>{item.prefix}</span>}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interests Section */}
                    <div>
                        <div className="section-label">
                            <i className="fa-solid fa-star"></i>
                            <span>Interests</span>
                        </div>
                        <div className="pills-row">
                            {[
                                { id: 'mixed', label: 'Mixed', icon: 'fa-star' },
                                { id: 'adventure', label: 'Adventure' },
                                { id: 'waterfall', label: 'Nature' },
                                { id: 'temple', label: 'Heritage' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`pill-btn ${placeType === item.id ? 'active-outline' : ''}`}
                                    onClick={() => setPlaceType(item.id)}
                                >
                                    {item.icon && <i className={`fa-solid ${item.icon}`}></i>}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Optional Custom Requests Accordion */}
                    <div>
                        <button 
                            type="button" 
                            className="custom-prompt-toggle"
                            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                        >
                            <i className={`fa-solid ${showCustomPrompt ? 'fa-chevron-up' : 'fa-sliders'}`}></i>
                            <span>{showCustomPrompt ? 'Hide custom requests' : 'Add custom requests (optional)'}</span>
                        </button>
                        {showCustomPrompt && (
                            <textarea
                                className="custom-prompt-box"
                                rows="2"
                                placeholder="E.g., wheelchair access, vegan/Jain food, elderly-friendly pace..."
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                            ></textarea>
                        )}
                    </div>

                    {/* Generate Itinerary Button */}
                    <button 
                        onClick={generatePlan} 
                        className="generate-btn"
                        disabled={loading}
                    >
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        <span>Generate Itinerary</span>
                        <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </aside>

            {/* ── Right Main Card (Laptop & Tablet) ── */}
            <main className="main-content-card">
                {loading ? (
                    <div className="loading-view">
                        <div className="loading-spinner-circle"></div>
                        <p className="loading-msg-text">{loadingMsg}</p>
                    </div>
                ) : (outputHtml || weatherData) ? (
                    <div className="result-view-wrap" id="itineraryOutputTarget">
                        {/* Results Header */}
                        <div className="result-header-bar">
                            <div className="result-title-group">
                                <h2>Your Tamil Nadu Itinerary</h2>
                                <p>{city} • {startDate} to {endDate}</p>
                            </div>
                            <div className="result-actions-row">
                                <button className="action-pill-btn btn-saved">
                                    <i className="fa-solid fa-circle-check"></i>
                                    <span>Auto-saved</span>
                                </button>
                                <button 
                                    onClick={() => navigate('/trip-history')}
                                    className="action-pill-btn btn-history"
                                >
                                    <i className="fa-solid fa-clock-rotate-left"></i>
                                    <span>Trip History</span>
                                </button>
                                <button 
                                    onClick={generateCalendarEvents}
                                    className="action-pill-btn btn-calendar"
                                    disabled={isExporting}
                                >
                                    <i className="fa-solid fa-calendar-plus"></i>
                                    <span>Sync Calendar</span>
                                </button>
                                <button 
                                    onClick={downloadPDF}
                                    className="action-pill-btn btn-pdf"
                                >
                                    <i className="fa-solid fa-file-pdf"></i>
                                    <span>Download PDF</span>
                                </button>
                            </div>
                        </div>

                        {/* Live Weather Forecast Cards */}
                        {weatherData && (
                            <div className="weather-section-sage">
                                <div className="weather-header-sage">
                                    <span className="weather-pill-tag">
                                        <i className="fa-solid fa-cloud-sun"></i> Live Weather Outlook for {weatherCity}
                                    </span>
                                </div>
                                <div className="weather-grid-cards">
                                    {weatherData.map((s) => (
                                        <div key={s.day} className="weather-day-card">
                                            <div className="day-badge-row">
                                                <span className="day-badge-num">DAY {s.day}</span>
                                                <span className="day-rel-name">{s.relativeDay}</span>
                                            </div>
                                            <div className="temp-large">{s.temp}°C</div>
                                            <div className="desc-text">{s.desc}</div>
                                            <div className="weather-metrics-pill">
                                                <span>Feels {s.feelsLike}°</span>
                                                <span>Humidity {s.humidity}%</span>
                                                <span>Rain {s.rainChance}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Replan Day Section */}
                        <div className="replan-box-wrap">
                            <h4>
                                <i className="fa-solid fa-arrows-rotate"></i>
                                <span>Want to adjust a specific day?</span>
                            </h4>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <select
                                    value={selectedDayToReplan}
                                    onChange={(e) => setSelectedDayToReplan(e.target.value)}
                                    className="replan-select"
                                    style={{ maxWidth: '140px' }}
                                >
                                    {(startDate && endDate) ? getDaysInRange(startDate, endDate).map((_, i) => (
                                        <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                                    )) : <option value="1">Day 1</option>}
                                </select>
                                <input
                                    type="text"
                                    placeholder="E.g., more temple time, lighter walking, authentic lunch..."
                                    value={replanFeedback}
                                    onChange={(e) => setReplanFeedback(e.target.value)}
                                    className="replan-textarea"
                                    style={{ flex: 1, minWidth: '220px' }}
                                />
                                <button 
                                    onClick={replanDay} 
                                    className="action-pill-btn btn-pdf"
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    Update Day {selectedDayToReplan}
                                </button>
                            </div>
                        </div>

                        {/* Markdown Generated Itinerary */}
                        {outputHtml && (
                            <div 
                                className="itinerary-content-card-sage"
                                dangerouslySetInnerHTML={{ __html: outputHtml }}
                            ></div>
                        )}

                        {/* Connected Modules Section */}
                        <div className="ecosystem-modules-sage">
                            <div className="ecosystem-header">
                                <span className="weather-pill-tag">
                                    <i className="fa-solid fa-compass"></i> TN Cultural Ecosystem
                                </span>
                                <h3>Enrich Your Experience</h3>
                            </div>
                            <div className="ecosystem-cards-grid">
                                {culinaryHighlight && (
                                    <div className="eco-card">
                                        <div className="eco-card-top">
                                            <span className="eco-badge">Flavors of TN</span>
                                            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{culinaryHighlight.region}</span>
                                        </div>
                                        <h4>{culinaryHighlight.title}</h4>
                                        <p className="eco-tagline">{culinaryHighlight.tagline}</p>
                                        <button 
                                            onClick={() => navigate(culinaryHighlight.link)}
                                            className="eco-action-btn"
                                        >
                                            <span>Explore Culinary</span>
                                            <i className="fa-solid fa-arrow-right"></i>
                                        </button>
                                    </div>
                                )}

                                {agriHighlight && (
                                    <div className="eco-card">
                                        <div className="eco-card-top">
                                            <span className="eco-badge">Agri & Village</span>
                                            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{agriHighlight.location}</span>
                                        </div>
                                        <h4>{agriHighlight.title}</h4>
                                        <p className="eco-tagline">{agriHighlight.stayType} • {agriHighlight.activities?.slice(0, 2).join(', ')}</p>
                                        <button 
                                            onClick={() => navigate(agriHighlight.link)}
                                            className="eco-action-btn"
                                        >
                                            <span>Explore Agri Hub</span>
                                            <i className="fa-solid fa-arrow-right"></i>
                                        </button>
                                    </div>
                                )}

                                {matchedGuides && matchedGuides.length > 0 && (
                                    <div className="eco-card">
                                        <div className="eco-card-top">
                                            <span className="eco-badge">Verified Guides</span>
                                            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{matchedGuides.length} Available</span>
                                        </div>
                                        <h4>Local Heritage Guides</h4>
                                        <p className="eco-tagline">Certified epigraphy and temple architectural experts in {city}.</p>
                                        <button 
                                            onClick={() => navigate('/guide')}
                                            className="eco-action-btn"
                                        >
                                            <span>Browse Guides</span>
                                            <i className="fa-solid fa-arrow-right"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Empty State View (Matches Image 1 Exactly) ── */
                    <div className="empty-state-view">
                        <img 
                            src="/suitcase_clean.png" 
                            alt="Your itinerary will appear here" 
                            className="empty-suitcase-art"
                        />
                        <h2 className="empty-state-heading">Your itinerary will appear here</h2>
                        <p className="empty-state-desc">
                            Select your preferences and click Generate Itinerary to get started.
                        </p>
                        <img 
                            src="/right_panel_landscape.png" 
                            alt="Tamil Nadu Gopuram Landscape" 
                            className="empty-landscape-art"
                        />
                    </div>
                )}
            </main>

            {/* ── Mobile Bottom Banner (Visible only on mobile screens < 900px) ── */}
            <div className="mob-bottom-bar"></div>

            {/* ── Google Calendar Sync Modal ── */}
            {showSyncModal && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(27, 67, 50, 0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={() => setShowSyncModal(false)}
                >
                    <div 
                        style={{
                            background: '#ffffff',
                            borderRadius: '24px',
                            maxWidth: '560px',
                            width: '100%',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #edf3eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <h3 style={{ margin: 0, color: '#1b4332', fontSize: '18px', fontWeight: 700 }}>
                                <i className="fa-solid fa-calendar-check" style={{ marginRight: '8px' }}></i>
                                Sync Itinerary to Google Calendar
                            </h3>
                            <button 
                                onClick={() => setShowSyncModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6c8874' }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '16px 24px' }}>
                            {calendarEvents.map((event, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    background: '#f4f7f1',
                                    borderRadius: '12px',
                                    marginBottom: '10px',
                                    border: '1px solid #e0e8dc'
                                }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '14px', color: '#1b4332' }}>{event.summary}</h4>
                                        <div style={{ fontSize: '12px', color: '#6c8874', marginTop: '2px' }}>
                                            Day {event.day} • {new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <a
                                        href={createGoogleCalendarUrl(event)}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            background: '#1b4332',
                                            color: '#ffffff',
                                            textDecoration: 'none',
                                            padding: '6px 14px',
                                            borderRadius: '9999px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        <i className="fa-solid fa-plus"></i> Add
                                    </a>
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: '1px solid #edf3eb', textAlign: 'right' }}>
                            <button
                                onClick={() => setShowSyncModal(false)}
                                style={{
                                    background: '#edf3eb',
                                    color: '#1b4332',
                                    border: 'none',
                                    padding: '8px 20px',
                                    borderRadius: '9999px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
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
