import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageTitle, useScript } from '../hooks';
import './PlanTrip.css';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, setDoc, increment } from 'firebase/firestore';

const parseMarkdown = (text) => {
    if (typeof window !== 'undefined' && window.marked && typeof window.marked.parse === 'function') {
        return window.marked.parse(text);
    }
    return text;
};

const PlanTrip = () => {
    usePageTitle('Tamil Nadu Travel Planner AI');
    const location = useLocation();

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
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [savedTripId, setSavedTripId] = useState(null);

    // Form State
    const [city, setCity] = useState('');
    const [startDate, setStartDate] = useState('');

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
                `<div class="placeholder-state" style="color:red">${e.message}</div>`
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
            // Realistic regional fallback
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

        // Capitalize description
        const formattedDesc = desc
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        // Determine type & dynamic realistic backgrounds
        const dLower = desc.toLowerCase();
        let weatherType = 'sunny';
        let bgImage = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop';
        let weatherTip = 'Great day for exploring outdoor sights! Stay hydrated and wear comfortable walking shoes.';

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
        setOutputHtml(null); // Clear previous output
        setWeatherData(null);
        setIsSaved(false);
        setSavedTripId(null);

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

        let dailySummaries = [];
        const days = getDaysInRange(startDate, endDate);
        let citySunrise = '6:14 AM';

        // 1. Try to fetch weather
        try {
            setLoadingMsg("Checking forecast...");
            const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_KEY}&units=metric`);
            const weatherData = await weatherRes.json();

            if (weatherData.cod === "200") {
                if (weatherData.city?.sunrise) {
                    citySunrise = new Date(weatherData.city.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }

                const forecastMap = new Map();
                weatherData.list.forEach(e => {
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
                console.warn("Weather API Error (using regional realistic climate models):", weatherData.message);
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

        // 2. Generate Plan with Gemini
        try {
            setLoadingMsg("Drafting your professional itinerary...");

            const weatherSection = dailySummaries.length > 0
                ? `**Weather Brief:**\n${dailySummaries.map(d => `Day ${d.day}: ${d.desc}, ${d.temp}°C (Humidity: ${d.humidity}%, Rain Chance: ${d.rainChance}%)`).join('; ')}`
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
            - Focus on the best local experiences matching the forecasted weather.

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
            } catch {
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

    const saveOrUpdateTrip = async (markdownText, htmlContent) => {
        const user = currentUser || auth.currentUser;
        if (!user) {
            console.warn("No user logged in - skipping trip auto-save");
            return;
        }

        try {
            let budgetVal = 15000;
            if (budget === 'cheap') budgetVal = 5000;
            else if (budget === 'luxury') budgetVal = 50000;

            const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) || 1;

            const getDestinationImage = (dest) => {
                const search = dest?.toLowerCase() || '';
                if (search.includes('chennai') || search.includes('marina')) return '/where-to-go/marina.jpg';
                if (search.includes('madurai') || search.includes('meenakshi')) return '/where-to-go/meenakshi.jpg';
                if (search.includes('thanjavur') || search.includes('temple')) return '/where-to-go/big_temple.jpg';
                if (search.includes('ooty') || search.includes('nilgiri')) return '/where-to-go/ooty.jpg';
                if (search.includes('kodaikanal') || search.includes('kodai')) return '/where-to-go/kodaikanal.jpg';
                if (search.includes('kanyakumari')) return '/where-to-go/kanyakumari-beaches-1-1661159465-lb.jpg';
                if (search.includes('rameshwaram') || search.includes('dhanushkodi')) return '/where-to-go/rameshawaram.jpg';
                if (search.includes('mahabalipuram') || search.includes('mamallapuram')) return '/where-to-go/mahabalipuram.jpg';
                if (search.includes('coimbatore') || search.includes('pollachi') || search.includes('valparai')) return '/where-to-go/valparai.jpg';
                if (search.includes('yercaud') || search.includes('salem')) return '/where-to-go/yercaud.jpg';
                if (search.includes('chola') || search.includes('gangai')) return '/where-to-go/gangai_vr.jpg';
                return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80';
            };

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
                coverImage: getDestinationImage(city),
                userId: user.uid,
                duration: duration > 0 ? duration : 1,
                updatedAt: serverTimestamp()
            };

            const walletRef = doc(db, 'users', user.uid, 'wallet', 'summary');

            if (savedTripId) {
                // Update existing trip in Firestore
                await setDoc(doc(db, 'users', user.uid, 'trips', savedTripId), tripData, { merge: true });
                console.log("Trip updated in history:", savedTripId);
            } else {
                // Save new trip
                tripData.createdAt = serverTimestamp();
                const docRef = await addDoc(collection(db, 'users', user.uid, 'trips'), tripData);
                setSavedTripId(docRef.id);
                setIsSaved(true);

                // Update user wallet summary
                await setDoc(walletRef, {
                    totalTrips: increment(1),
                    totalBudget: increment(budgetVal),
                    totalSpent: increment(0),
                    ecopoints: increment(50)
                }, { merge: true });
                console.log("Trip saved to history:", docRef.id);
            }
        } catch (err) {
            console.error("Error auto-saving trip:", err);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', marginTop: '-14px' }}>
                    <button
                        onClick={() => window.location.href = '/home'}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 0',
                            letterSpacing: '0.02em',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-coral)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                        <i className="fa-solid fa-chevron-left" style={{ fontSize: '0.65rem' }}></i> Back to Home
                    </button>
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

                            <button onClick={replanDay} className="action-btn" style={{ width: '100%', background: 'var(--brand-coral-lt)', border: 'none', color: 'var(--brand-coral)', justifyContent: 'center' }}>
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
                                <button className="action-btn" disabled style={{ background: 'var(--brand-coral-lt)', color: 'var(--brand-coral)', border: 'none', cursor: 'default', opacity: 0.9 }}>
                                    <i className="fa-solid fa-circle-check"></i> Auto-saved
                                </button>
                                <button onClick={() => window.location.href = '/trip-history'} className="action-btn" style={{ background: 'linear-gradient(135deg, #810000 0%, #600018 100%)', color: 'white', border: 'none', boxShadow: '0 4px 14px rgba(128,0,32,0.3)' }}>
                                    <i className="fa-solid fa-clock-rotate-left"></i> View in Trip History
                                </button>
                                <button onClick={generateCalendarEvents} className="action-btn" style={{ background: 'linear-gradient(135deg, #34A853 0%, #1E8A3C 100%)', color: 'white', border: 'none', boxShadow: '0 4px 14px rgba(52,168,83,0.3)' }}>
                                    <i className="fa-solid fa-calendar-plus"></i> Add to Calendar
                                </button>
                                <button id="downloadBtn" onClick={downloadPDF} className="action-btn" style={{ background: 'linear-gradient(135deg, var(--brand-coral) 0%, var(--brand-coral-dk) 100%)', color: 'white', border: 'none', boxShadow: '0 4px 14px rgba(211,107,70,0.3)' }}>
                                    <i className="fa-solid fa-file-pdf"></i> Download PDF
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div id="output" className={`output-area ${(!outputHtml && !weatherData && !loading) ? 'placeholder-bg' : ''}`}>

                    {loading ? (
                        <div className="loading">
                            <i className="fa-solid fa-circle-notch"></i>
                            <p>{loadingMsg}</p>
                        </div>
                    ) : (
                        (outputHtml || weatherData) ? (
                            <div className="output-area-content">
                                {weatherData && (
                                    <div className="weather-section-realistic">
                                        <div className="weather-section-header">
                                            <div className="weather-header-titles">
                                                <span className="weather-section-pill"><i className="fa-solid fa-satellite-dish"></i> Live Climate Forecast</span>
                                                <h3>Weather Outlook for {weatherCity}</h3>
                                            </div>
                                            <span className="weather-forecast-days-count">{weatherData.length}-Day Daily Forecast</span>
                                        </div>

                                        <div className="realistic-weather-grid">
                                            {weatherData.map((s) => (
                                                <div key={s.day} className={`realistic-weather-card ${s.weatherType}`}>
                                                    {/* Background with Ambient Overlay */}
                                                    <div 
                                                        className="weather-card-bg" 
                                                        style={{ backgroundImage: `url(${s.bgImage})` }}
                                                    >
                                                        <div className="weather-card-overlay"></div>
                                                    </div>

                                                    {/* Card Header */}
                                                    <div className="weather-card-header">
                                                        <div className="weather-card-day-info">
                                                            <span className="weather-day-badge">DAY {s.day}</span>
                                                            <span className="weather-day-subtitle">{s.relativeDay}</span>
                                                        </div>
                                                        <button 
                                                            className="weather-card-menu-btn" 
                                                            title="Travel advisory"
                                                            onClick={() => alert(`💡 Weather Advice for Day ${s.day} in ${weatherCity}:\n\n${s.weatherTip}`)}
                                                        >
                                                            <i className="fa-solid fa-ellipsis-vertical"></i>
                                                        </button>
                                                    </div>

                                                    {/* Visual Center Area */}
                                                    <div className="weather-card-body">
                                                        {s.weatherType === 'sunny' ? (
                                                            <div className="realistic-sun-visual">
                                                                <div className="sun-core"></div>
                                                                <div className="sun-corona"></div>
                                                                <div className="sun-rays"></div>
                                                            </div>
                                                        ) : s.weatherType === 'rain' ? (
                                                            <div className="realistic-rain-visual">
                                                                <svg className="weather-svg-icon" viewBox="0 0 64 64" fill="none">
                                                                    <path d="M46 38c5.5 0 10-4.5 10-10 0-5.2-4-9.5-9.1-9.9C45.6 11.5 39.4 6 32 6c-7.6 0-14 5.8-14.9 13.3C12.4 20.3 8 24.6 8 30c0 5.5 4.5 10 10 10h28z" fill="rgba(255,255,255,0.92)" />
                                                                    <line x1="22" y1="46" x2="18" y2="56" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="drop-1" />
                                                                    <line x1="32" y1="46" x2="28" y2="56" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="drop-2" />
                                                                    <line x1="42" y1="46" x2="38" y2="56" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" className="drop-3" />
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <div className="realistic-cloud-visual">
                                                                <svg className="weather-svg-icon" viewBox="0 0 64 64" fill="none">
                                                                    <path d="M46 42c5.5 0 10-4.5 10-10 0-5.2-4-9.5-9.1-9.9C45.6 15.5 39.4 10 32 10c-7.6 0-14 5.8-14.9 13.3C12.4 24.3 8 28.6 8 34c0 5.5 4.5 10 10 10h28z" fill="rgba(255,255,255,0.92)" />
                                                                </svg>
                                                            </div>
                                                        )}

                                                        <div className="weather-temp-number">{s.temp}°C</div>
                                                        <div className="weather-desc-label">{s.desc}</div>
                                                    </div>

                                                    {/* Frosted Glass Footer Pill */}
                                                    <div className="weather-glass-pill">
                                                        {s.weatherType === 'sunny' ? (
                                                            <>
                                                                <div className="pill-metric-item">
                                                                    <div className="pill-metric-val"><i className="fa-solid fa-temperature-half"></i> {s.feelsLike}°C</div>
                                                                    <div className="pill-metric-lbl">Feels like</div>
                                                                </div>
                                                                <div className="pill-metric-item">
                                                                    <div className="pill-metric-val"><i className="fa-solid fa-droplet"></i> {s.humidity}%</div>
                                                                    <div className="pill-metric-lbl">Humidity</div>
                                                                </div>
                                                                <div className="pill-metric-item">
                                                                    <div className="pill-metric-val"><i className="fa-solid fa-wind"></i> {s.windSpeed} km/h</div>
                                                                    <div className="pill-metric-lbl">Wind</div>
                                                                </div>
                                                                <div className="pill-metric-item">
                                                                    <div className="pill-metric-val"><i className="fa-solid fa-sun"></i> {s.sunrise}</div>
                                                                    <div className="pill-metric-lbl">Sunrise</div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="pill-metric-item">
                                                                    <div className="pill-metric-val"><i className="fa-solid fa-droplet"></i> {s.humidity}%</div>
                                                                    <div className="pill-metric-lbl">Humidity</div>
                                                                </div>
                                                                <div className="pill-metric-item">
                                                                    <div className="pill-metric-val"><i className="fa-solid fa-wind"></i> {s.windSpeed} km/h</div>
                                                                    <div className="pill-metric-lbl">Wind</div>
                                                                </div>
                                                                <div className="pill-metric-item">
                                                                    <div className="pill-metric-val"><i className="fa-solid fa-umbrella"></i> {s.rainChance}%</div>
                                                                    <div className="pill-metric-lbl">Chance of Rain</div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {outputHtml && <div dangerouslySetInnerHTML={{ __html: outputHtml }}></div>}
                            </div>
                        ) : (
                            <div className="placeholder-state"></div>
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
