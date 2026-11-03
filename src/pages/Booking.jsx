import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageTitle, usePageStyle } from '../hooks';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Booking = () => {
    usePageTitle('Hotel Booking - Tamil Nadu | Premium Hotel Search');
    usePageStyle('/booking/style.css');
    usePageStyle('/booking/colorful.css');

    const [searchInput, setSearchInput] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [radius, setRadius] = useState(10000);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [locationInfo, setLocationInfo] = useState(null);
    const [results, setResults] = useState([]);
    
    // Post-search filter states
    const [ratingFilter, setRatingFilter] = useState('all');
    const [priceFilter, setPriceFilter] = useState('all');
    const [sortBy, setSortBy] = useState('default');
    const [searchTextFilter, setSearchTextFilter] = useState('');

    // Modal States
    const [hotelDetailsModal, setHotelDetailsModal] = useState(null);
    const [bookingModal, setBookingModal] = useState(null); // { placeId, name, rooms }
    const [bookingFormModal, setBookingFormModal] = useState(null); // { hotelId, roomNumber, hotelName }
    const [idType, setIdType] = useState('Aadhar Card');
    const [idFile, setIdFile] = useState(null); // { name, size, type, dataURL }
    const [bookingSuccessModal, setBookingSuccessModal] = useState(null); // booking summary data
    const [bookingInProgress, setBookingInProgress] = useState(false);

    // Who (Guests) dropdown state
    const [guests, setGuests] = useState({
        adults: 1,
        children: 0,
        infants: 0,
        pets: 0
    });
    const [whoDropdownOpen, setWhoDropdownOpen] = useState(false);
    const whoDropdownRef = useRef(null);

    // Close "Who" dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (whoDropdownRef.current && !whoDropdownRef.current.contains(event.target)) {
                setWhoDropdownOpen(false);
            }
        };
        if (whoDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [whoDropdownOpen]);

    const updateGuestCount = (category, delta) => {
        setGuests(prev => {
            const current = prev[category] || 0;
            const next = current + delta;
            const limits = {
                adults: { min: 1, max: 10 },
                children: { min: 0, max: 6 },
                infants: { min: 0, max: 5 },
                pets: { min: 0, max: 3 }
            };
            const { min, max } = limits[category];
            if (next < min || next > max) return prev;
            return { ...prev, [category]: next };
        });
    };

    const getGuestsSummary = (customGuests = guests) => {
        const parts = [];
        const totalAdults = customGuests?.adults || 1;
        parts.push(`${totalAdults} ${totalAdults === 1 ? 'Adult' : 'Adults'}`);
        if (customGuests?.children > 0) {
            parts.push(`${customGuests.children} ${customGuests.children === 1 ? 'Child' : 'Children'}`);
        }
        if (customGuests?.infants > 0) {
            parts.push(`${customGuests.infants} ${customGuests.infants === 1 ? 'Infant' : 'Infants'}`);
        }
        if (customGuests?.pets > 0) {
            parts.push(`${customGuests.pets} ${customGuests.pets === 1 ? 'Pet' : 'Pets'}`);
        }
        return parts.join(', ');
    };

    // Lock body scroll and prevent background layout shift when any modal is open
    useEffect(() => {
        const isModalOpen = Boolean(hotelDetailsModal || bookingModal || bookingFormModal || bookingSuccessModal);
        if (isModalOpen) {
            const originalOverflow = document.body.style.overflow;
            const originalPaddingRight = document.body.style.paddingRight;
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            if (scrollBarWidth > 0) {
                document.body.style.paddingRight = `${scrollBarWidth}px`;
            }
            return () => {
                document.body.style.overflow = originalOverflow;
                document.body.style.paddingRight = originalPaddingRight;
            };
        }
    }, [hotelDetailsModal, bookingModal, bookingFormModal, bookingSuccessModal]);

    const placesService = useRef(null);
    const geocoder = useRef(null);
    const canvasRef = useRef(null);

    // Initialize Maps
    useEffect(() => {
        const initGoogleMaps = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                const mapElement = document.createElement('div');
                const map = new window.google.maps.Map(mapElement, {
                    center: { lat: 10.7905, lng: 78.7047 }, // Tamil Nadu center
                    zoom: 7
                });
                placesService.current = new window.google.maps.places.PlacesService(map);
                geocoder.current = new window.google.maps.Geocoder();
                console.log('Google Maps API initialized successfully');
            }
        };

        if (window.google && window.google.maps) {
            initGoogleMaps();
        } else {
            const interval = setInterval(() => {
                if (window.google && window.google.maps) {
                    initGoogleMaps();
                    clearInterval(interval);
                }
            }, 500);
            return () => clearInterval(interval);
        }
    }, []);

    // Canvas Particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let particles = [];
        const particleCount = 40;
        let animationFrameId;

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.size = Math.random() * 1.5 + 0.5;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.fillStyle = 'rgba(255, 140, 0, 0.6)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.strokeStyle = `rgba(255, 140, 0, ${0.1 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(animateParticles);
        };

        initParticles();
        animateParticles();
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Cursor Glow
    useEffect(() => {
        const handleMouseMove = (e) => {
            const glow = document.querySelector('.cursor-glow');
            if (glow) {
                glow.style.left = e.clientX + 'px';
                glow.style.top = e.clientY + 'px';
                glow.style.opacity = '1';
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const TAMIL_NADU_CITIES = {
        'Salem': 'Salem, Tamil Nadu, India',
        'Chennai': 'Chennai, Tamil Nadu, India',
        'Coimbatore': 'Coimbatore, Tamil Nadu, India',
        'Madurai': 'Madurai, Tamil Nadu, India',
        'Trichy': 'Tiruchirappalli, Tamil Nadu, India',
        'Tirunelveli': 'Tirunelveli, Tamil Nadu, India',
        'Erode': 'Erode, Tamil Nadu, India',
        'Vellore': 'Vellore, Tamil Nadu, India',
        'Thanjavur': 'Thanjavur, Tamil Nadu, India',
        'Dindigul': 'Dindigul, Tamil Nadu, India',
        'Tuticorin': 'Thoothukudi, Tamil Nadu, India',
        'Kanchipuram': 'Kanchipuram, Tamil Nadu, India',
        'Nagercoil': 'Nagercoil, Tamil Nadu, India',
        'Karur': 'Karur, Tamil Nadu, India',
        'Hosur': 'Hosur, Tamil Nadu, India',
        'Krishnagiri': 'Krishnagiri, Tamil Nadu, India',
        'Namakkal': 'Namakkal, Tamil Nadu, India',
        'Dharmapuri': 'Dharmapuri, Tamil Nadu, India',
        'Cuddalore': 'Cuddalore, Tamil Nadu, India',
        'Pudukkottai': 'Pudukkottai, Tamil Nadu, India',
        'Kumbakonam': 'Kumbakonam, Tamil Nadu, India'
    };

    const formatAddressForTamilNadu = (address) => {
        const trimmedAddress = address.trim();
        if (TAMIL_NADU_CITIES[trimmedAddress]) return TAMIL_NADU_CITIES[trimmedAddress];
        if (trimmedAddress.toLowerCase().includes('tamil nadu') || trimmedAddress.toLowerCase().includes('india')) return trimmedAddress;
        // Search keys
        const foundKey = Object.keys(TAMIL_NADU_CITIES).find(k => k.toLowerCase() === trimmedAddress.toLowerCase());
        if (foundKey) return TAMIL_NADU_CITIES[foundKey];
        // Partial match
        const foundPartial = Object.keys(TAMIL_NADU_CITIES).find(k => trimmedAddress.toLowerCase().includes(k.toLowerCase()));
        if (foundPartial) return TAMIL_NADU_CITIES[foundPartial];

        return trimmedAddress + ', Tamil Nadu, India';
    };

    const geocodeLocation = (address) => {
        return new Promise((resolve, reject) => {
            if (!geocoder.current) {
                reject('Geocoder not initialized');
                return;
            }
            const formattedAddress = formatAddressForTamilNadu(address);

            geocoder.current.geocode({
                address: formattedAddress,
                region: 'IN'
            }, (results, status) => {
                const processResult = (res) => {
                    resolve({
                        lat: res.geometry.location.lat(),
                        lng: res.geometry.location.lng(),
                        formattedAddress: res.formatted_address
                    });
                };

                if (status === 'OK' && results[0]) {
                    // Optimistic check
                    processResult(results[0]);
                } else {
                    // Retry with suffix
                    const retryAddress = address.trim() + ', Tamil Nadu, India';
                    geocoder.current.geocode({ address: retryAddress, region: 'IN' }, (results2, status2) => {
                        if (status2 === 'OK' && results2[0]) {
                            processResult(results2[0]);
                        } else {
                            reject('Location not found. Status: ' + status);
                        }
                    })
                }
            });
        });
    };

    const searchNearbyHotels = (location, rad, kw) => {
        return new Promise((resolve, reject) => {
            if (!placesService.current) {
                reject('Places Service not initialized');
                return;
            }
            const request = {
                location: new window.google.maps.LatLng(location.lat, location.lng),
                radius: rad,
                type: 'lodging',
                keyword: kw || 'hotel'
            };
            placesService.current.nearbySearch(request, (res, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    // We need details for each. 
                    // IMPORTANT: getDetails is rate limited and async. Doing it for all might get throttled. 
                    // For 'exact output' I should do it, but maybe batching or just one by one?
                    // The original script calls `getPlaceDetails(results)` which iterates and calls `getDetails` for ALL.
                    // This often hits query limits. I will mimic it but be aware.
                    // I will resolve with the basic results mixed with details promises?
                    // Actually, the original script does not wait for details to resolve before showing cards?
                    // It calls `getPlaceDetails` which clears container and adds cards one by one as they arrive.
                    // I will emulate this by resolving the basic list, then fetching details in `setResults`.
                    resolve(res);
                } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    resolve([]);
                } else {
                    reject(status);
                }
            });
        });
    };

    const getPlaceDetails = (place) => {
        return new Promise((resolve) => {
            const request = {
                placeId: place.place_id,
                fields: ['name', 'formatted_address', 'formatted_phone_number', 'international_phone_number', 'rating', 'user_ratings_total', 'types', 'photos', 'price_level', 'geometry', 'website', 'url', 'opening_hours', 'vicinity', 'plus_code', 'editorial_summary', 'reviews', 'address_components', 'place_id', 'business_status']
            };
            placesService.current.getDetails(request, (details, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && details) {
                    resolve({ ...place, ...details });
                } else {
                    resolve(place); // Fallback to basic info
                }
            });
        });
    };

    const handleSearch = async () => {
        if (!searchInput) {
            setError('Please enter a Tamil Nadu city name to search');
            return;
        }
        setLoading(true);
        setError('');
        setResults([]);
        setLocationInfo(null);
        
        // Reset post-search filters
        setRatingFilter('all');
        setPriceFilter('all');
        setSortBy('default');
        setSearchTextFilter('');

        try {
            const location = await geocodeLocation(searchInput);
            if (!location) {
                setError('Location not found in Tamil Nadu.');
                setLoading(false);
                return;
            }
            setLocationInfo(location.formattedAddress);

            const basicResults = await searchNearbyHotels(location, radius, keywordInput);

            if (basicResults.length === 0) {
                setError('No hotels found in this area.');
            } else {
                // Fetch details for all (parallel)
                // Note: logic in original script was fire-and-forget for displayHotelCard.
                // Here we want to update state.
                const detailedResults = await Promise.all(basicResults.map(p => getPlaceDetails(p)));
                setResults(detailedResults);
            }

        } catch (e) {
            console.error(e);
            setError('Error: ' + e);
        } finally {
            setLoading(false);
        }
    };

    // Room Manager Logic
    const initRooms = (place) => {
        const key = `rooms_${place.place_id}`;
        if (!localStorage.getItem(key)) {
            const rooms = [];
            for (let f = 1; f <= 3; f++) {
                for (let r = 1; r <= 4; r++) {
                    rooms.push({
                        number: `${f}0${r}`,
                        status: Math.random() > 0.7 ? 'booked' : 'available',
                        type: r % 2 === 0 ? 'Double' : 'Single',
                        price: 1000 + Math.random() * 2000
                    });
                }
            }
            localStorage.setItem(key, JSON.stringify(rooms));
        }
        return JSON.parse(localStorage.getItem(key));
    };

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        const MAX_SIZE = 800;
                        if (width > height) {
                            if (width > MAX_SIZE) {
                                height *= MAX_SIZE / width;
                                width = MAX_SIZE;
                            }
                        } else {
                            if (height > MAX_SIZE) {
                                width *= MAX_SIZE / height;
                                height = MAX_SIZE;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const dataURL = canvas.toDataURL('image/jpeg', 0.6);
                        resolve(dataURL);
                    } catch (e) {
                        reject(e);
                    }
                };
                img.onerror = (e) => reject(e);
                img.src = event.target.result;
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    };

    const readOriginalFile = (file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setIdFile({
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                type: file.type,
                dataURL: reader.result
            });
        };
        reader.readAsDataURL(file);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type.startsWith('image/')) {
            try {
                const compressedDataURL = await compressImage(file);
                // Extract file name base
                const dotIndex = file.name.lastIndexOf('.');
                const baseName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
                setIdFile({
                    name: baseName + '.jpg',
                    size: (compressedDataURL.length * 0.75 / 1024).toFixed(1) + ' KB',
                    type: 'image/jpeg',
                    dataURL: compressedDataURL
                });
            } catch (err) {
                console.error("Image compression failed, falling back to original:", err);
                readOriginalFile(file);
            }
        } else {
            // PDF or other documents
            if (file.size > 700 * 1024) {
                alert('PDF files must be under 700 KB to fit database size limits. Please upload a compressed PDF or a JPG/PNG image.');
                e.target.value = '';
                return;
            }
            readOriginalFile(file);
        }
    };

    const bookRoom = async (e) => {
        e.preventDefault();
        if (!idFile) {
            alert('Please upload your ID proof first!');
            return;
        }

        const { hotelId, roomNumber, hotelName, price, placeName } = bookingFormModal;
        const formData = new FormData(e.target);
        const guestName = formData.get('guestName');
        const contactNumber = formData.get('contactNumber');
        const checkInDate = formData.get('checkIn');
        const checkOutDate = formData.get('checkOut');

        setBookingInProgress(true);

        try {
            // Store details in Firestore
            // Path: hotels/{placeName}/hotelNames/{hotelName}/bookings/{bookingId}
            const bookingRef = collection(db, 'hotels', placeName, 'hotelNames', hotelName, 'bookings');
            await addDoc(bookingRef, {
                guestName,
                contactNumber,
                checkInDate,
                checkOutDate,
                guests,
                totalGuests: (guests.adults || 0) + (guests.children || 0) + (guests.infants || 0),
                roomNumber,
                price,
                idType,
                idFileName: idFile.name,
                idFileSize: idFile.size,
                idFileType: idFile.type,
                idFileData: idFile.dataURL,
                bookedAt: serverTimestamp()
            });

            // Update Local Storage Status
            const key = `rooms_${hotelId}`;
            let rooms = JSON.parse(localStorage.getItem(key));
            const idx = rooms.findIndex(r => r.number === roomNumber);
            if (idx !== -1) {
                rooms[idx].status = 'booked';
                localStorage.setItem(key, JSON.stringify(rooms));
            }

            // Set success modal state
            setBookingSuccessModal({
                hotelName,
                roomNumber,
                price,
                guestName,
                contactNumber,
                checkInDate,
                checkOutDate,
                guests,
                idType,
                idFile
            });
            
            setBookingFormModal(null);
            setBookingModal(null); // Close everything
        } catch (error) {
            console.error("Firestore booking storage failed: ", error);
            alert("Database Error: Failed to secure booking. " + error.message);
        } finally {
            setBookingInProgress(false);
        }
    };

    // Filtered and Sorted Results
    const filteredResults = results
        .filter(place => {
            if (ratingFilter !== 'all') {
                const minRating = parseFloat(ratingFilter);
                if (!place.rating || place.rating < minRating) return false;
            }
            if (priceFilter !== 'all') {
                if (priceFilter === 'budget') {
                    if (place.price_level !== undefined && place.price_level > 2) return false;
                } else if (priceFilter === 'luxury') {
                    if (place.price_level === undefined || place.price_level <= 2) return false;
                }
            }
            if (searchTextFilter.trim() !== '') {
                const query = searchTextFilter.toLowerCase();
                const nameMatch = place.name?.toLowerCase().includes(query);
                const addressMatch = (place.formatted_address || place.vicinity)?.toLowerCase().includes(query);
                if (!nameMatch && !addressMatch) return false;
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'rating') {
                return (b.rating || 0) - (a.rating || 0);
            }
            if (sortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            }
            if (sortBy === 'price') {
                return (a.price_level !== undefined ? a.price_level : 0) - (b.price_level !== undefined ? b.price_level : 0);
            }
            return 0;
        });

    return (
        <div className="booking-page-wrapper">
            <Navbar />
            <canvas ref={canvasRef} id="particleCanvas"></canvas>
            <div className="cursor-glow"></div>

            <div className="booking-hero">
                <div className="header-content">
                    <h1>Hotel Booking <br /> <span className="brand-accent">Tamil Nadu</span></h1>
                    <p className="subtitle">Discover premium hotels across Tamil Nadu with our advanced search platform</p>
                </div>
            </div>

            <div className="container main-content">

                <div className="search-section">
                    <div className="search-header">
                        <h2>Find Your Perfect Stay</h2>
                        <p>Search for hotels in any Tamil Nadu city</p>
                    </div>
                    <div className="search-box">
                        <div className="input-wrapper">
                            <input type="text" id="searchInput" placeholder="Enter city name (e.g., Salem, Chennai)" value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} />
                        </div>
                        <button id="searchBtn" onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                    <div className="filters">
                        <div className="filter-group">
                            <label>Filter by Keyword</label>
                            <div className="input-wrapper">
                                <input type="text" id="keywordInput" placeholder="e.g., luxury, budget" className="filter-input" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} />
                            </div>
                        </div>
                        <div className="filter-group">
                            <label>Search Radius</label>
                            <select className="filter-input" value={radius} onChange={e => setRadius(parseInt(e.target.value))}>
                                <option value="5000">5 km</option>
                                <option value="10000">10 km</option>
                                <option value="20000">20 km</option>
                                <option value="50000">50 km</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading && <div id="loading" className="loading" style={{ display: 'block' }}><div className="spinner"></div><p>Searching for hotels...</p></div>}

                {error && <div id="error" className="error" style={{ display: 'block' }}>{error}</div>}

                {locationInfo && (
                    <div id="locationInfo" className="location-info" style={{ display: 'block' }}>
                        <div className="location-badge">
                            <div className="location-text">
                                <span className="location-label">Searching in</span>
                                <span className="location-name">{locationInfo}</span>
                            </div>
                        </div>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="post-search-filters-bar">
                        <div className="filter-title">
                            <i className="fa-solid fa-sliders"></i> Filter Stays ({filteredResults.length} found)
                        </div>
                        <div className="filters-row">
                            <div className="filter-item-col">
                                <label>Star Rating</label>
                                <select className="filter-select-inline" value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}>
                                    <option value="all">All Ratings</option>
                                    <option value="4.5">4.5+ ★ Outstanding</option>
                                    <option value="4.0">4.0+ ★ Very Good</option>
                                    <option value="3.5">3.5+ ★ Good</option>
                                </select>
                            </div>
                            <div className="filter-item-col">
                                <label>Pricing Class</label>
                                <select className="filter-select-inline" value={priceFilter} onChange={e => setPriceFilter(e.target.value)}>
                                    <option value="all">All Prices</option>
                                    <option value="budget">Budget / Mid-range</option>
                                    <option value="luxury">Luxury / Premium</option>
                                </select>
                            </div>
                            <div className="filter-item-col">
                                <label>Sort By</label>
                                <select className="filter-select-inline" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                    <option value="default">Relevance</option>
                                    <option value="rating">Rating (Highest first)</option>
                                    <option value="name">Name (A to Z)</option>
                                    <option value="price">Price (Lowest first)</option>
                                </select>
                            </div>
                            <div className="filter-item-col search-within-col">
                                <label>Search Within Results</label>
                                <div className="input-search-within-wrapper">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Radisson, Residency" 
                                        className="filter-input-inline"
                                        value={searchTextFilter} 
                                        onChange={e => setSearchTextFilter(e.target.value)} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div id="results" className="results">
                    {filteredResults.map((place) => {
                        let photoUrl = '';
                        if (place.photos && place.photos.length > 0) {
                            photoUrl = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
                        }
                        return (
                            <div key={place.place_id} className="hotel-card">
                                {photoUrl ? (
                                    <img src={photoUrl} alt={place.name} />
                                ) : (
                                    <div className="hotel-card-fallback-img">
                                        <i className="fa-solid fa-hotel"></i>
                                    </div>
                                )}
                                <div className="hotel-card-content">
                                    <div className="hotel-name">{place.name}</div>
                                    <div className="hotel-address">
                                        <i className="fa-solid fa-location-dot" style={{ marginRight: '6px', color: '#9ca3af' }}></i>
                                        {place.formatted_address || place.vicinity}
                                    </div>
                                    {place.rating && (
                                        <div className="hotel-rating">
                                            <span className="rating-value">{place.rating.toFixed(1)} ★ {place.user_ratings_total && `(${place.user_ratings_total} reviews)`}</span>
                                        </div>
                                    )}
                                    <div className="hotel-info">
                                        <div className={`price-info ${place.price_level !== undefined ? 'has-price' : ''}`}>
                                            {place.price_level !== undefined ? ['Free', '$', '$$', '$$$', '$$$$'][place.price_level] : 'Contact for pricing'}
                                        </div>
                                        <button className="view-details" onClick={() => setHotelDetailsModal(place)}>View Details</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredResults.length === 0 && results.length > 0 && (
                        <div className="no-results-match">
                            <i className="fa-solid fa-hotel"></i>
                            <h3>No hotels match your filters</h3>
                            <p>Try adjusting your rating, pricing, or search term query.</p>
                        </div>
                    )}
                    {results.length === 0 && !loading && !error && <div className="no-results"></div>}
                </div>
            </div>

            {/* Hotel Details Modal */}
            {hotelDetailsModal && (
                <div id="hotelDetailsModal" className="modal" onClick={(e) => { if (e.target.id === 'hotelDetailsModal') setHotelDetailsModal(null) }}>
                    <div className="modal-content booking-modal-content hotel-details-modal-box">
                        <div className="booking-header">
                            <div className="modal-header-info">
                                <h2>{hotelDetailsModal.name}</h2>
                                <div className="modal-header-meta">
                                    {hotelDetailsModal.rating && (
                                        <span className="modal-meta-pill rating-pill">
                                            <i className="fa-solid fa-star"></i>
                                            <span>{hotelDetailsModal.rating.toFixed(1)}</span>
                                            {hotelDetailsModal.user_ratings_total && (
                                                <span className="meta-reviews">({hotelDetailsModal.user_ratings_total} reviews)</span>
                                            )}
                                        </span>
                                    )}
                                    {hotelDetailsModal.price_level !== undefined && (
                                        <span className="modal-meta-pill price-pill">
                                            {['Free', '$', '$$', '$$$', '$$$$'][hotelDetailsModal.price_level]}
                                        </span>
                                    )}
                                    <span className="modal-meta-pill status-pill">
                                        <span className="live-dot"></span> Verified Listing
                                    </span>
                                </div>
                            </div>
                            <span className="close-modal" onClick={() => setHotelDetailsModal(null)} title="Close">&times;</span>
                        </div>
                        <div className="booking-body hotel-details-body">
                            {/* Photo Gallery */}
                            {hotelDetailsModal.photos && hotelDetailsModal.photos.length > 0 && (
                                <div className="modal-section ambiance-section">
                                    <div className="section-title-row">
                                        <h3 className="section-title">
                                            <i className="fa-solid fa-camera-retro"></i> Property Ambiance
                                        </h3>
                                        <span className="photo-count-pill">{Math.min(6, hotelDetailsModal.photos.length)} Photos</span>
                                    </div>
                                    <div className="image-gallery">
                                        {hotelDetailsModal.photos.slice(0, 6).map((p, i) => (
                                            <div key={i} className="gallery-item">
                                                <img 
                                                    src={p.getUrl({ maxWidth: 600 })} 
                                                    alt={`${hotelDetailsModal.name} ambiance ${i + 1}`} 
                                                    loading="lazy" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Property Details Grid */}
                            <div className="modal-section details-overview-section">
                                <div className="section-title-row">
                                    <h3 className="section-title">
                                        <i className="fa-solid fa-circle-info"></i> Property Information
                                    </h3>
                                </div>
                                <div className="hotel-info-grid">
                                    {/* Address Card */}
                                    <div className="hotel-info-card">
                                        <div className="info-icon-box location-icon">
                                            <i className="fa-solid fa-location-dot"></i>
                                        </div>
                                        <div className="info-content-box">
                                            <span className="info-label">Address</span>
                                            <p className="info-value">{hotelDetailsModal.formatted_address || hotelDetailsModal.vicinity || 'Address not available'}</p>
                                            {hotelDetailsModal.url && (
                                                <a href={hotelDetailsModal.url} target="_blank" rel="noreferrer" className="info-action-link">
                                                    <span>Open in Google Maps</span>
                                                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Website Card */}
                                    {hotelDetailsModal.website && (
                                        <div className="hotel-info-card">
                                            <div className="info-icon-box website-icon">
                                                <i className="fa-solid fa-globe"></i>
                                            </div>
                                            <div className="info-content-box">
                                                <span className="info-label">Website</span>
                                                <a href={hotelDetailsModal.website} target="_blank" rel="noreferrer" className="info-action-link main-link">
                                                    <span>Visit Official Website</span>
                                                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                                </a>
                                                <span className="info-subtext">Direct booking & property info</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Phone Card */}
                                    {(hotelDetailsModal.formatted_phone_number || hotelDetailsModal.international_phone_number) && (
                                        <div className="hotel-info-card">
                                            <div className="info-icon-box phone-icon">
                                                <i className="fa-solid fa-phone"></i>
                                            </div>
                                            <div className="info-content-box">
                                                <span className="info-label">Contact Reception</span>
                                                <a href={`tel:${hotelDetailsModal.formatted_phone_number || hotelDetailsModal.international_phone_number}`} className="info-action-link main-link">
                                                    <span>{hotelDetailsModal.formatted_phone_number || hotelDetailsModal.international_phone_number}</span>
                                                </a>
                                                <span className="info-subtext">24/7 Desk assistance</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Footer */}
                        <div className="hotel-modal-footer">
                            <div className="footer-left-info">
                                <span className="footer-guarantee-badge">
                                    <i className="fa-solid fa-shield-halved"></i> Best Rate Guaranteed
                                </span>
                                <span className="footer-sub-tag">Direct reservations & verified check-in</span>
                            </div>
                            <button className="book-room-btn" onClick={() => {
                                setBookingModal({
                                    placeId: hotelDetailsModal.place_id,
                                    name: hotelDetailsModal.name,
                                    rooms: initRooms(hotelDetailsModal)
                                });
                                setHotelDetailsModal(null);
                            }}>
                                <span>Book a Room</span>
                                <i className="fa-solid fa-arrow-right-long"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Room Selection Modal */}
            {bookingModal && (
                <div id="bookingModal" className="modal" onClick={(e) => { if (e.target.id === 'bookingModal') setBookingModal(null) }}>
                    <div className="modal-content booking-modal-content">
                        <div className="booking-header">
                            <h2>Book Room at {bookingModal.name}</h2>
                            <span className="close-modal" onClick={() => setBookingModal(null)} title="Close">&times;</span>
                        </div>
                        <div className="booking-body">
                            <h3>Available Rooms</h3>
                            <div className="rooms-grid">
                                {bookingModal.rooms.filter(r => r.status === 'available').map((room) => (
                                    <div key={room.number} className="room-card available"
                                        onClick={() => {
                                            const rawSearch = searchInput.trim();
                                            const resolvedPlace = rawSearch ? rawSearch.split(',')[0].trim() : 'Tamil Nadu';
                                            setBookingFormModal({
                                                hotelId: bookingModal.placeId,
                                                roomNumber: room.number,
                                                hotelName: bookingModal.name,
                                                price: room.price,
                                                placeName: resolvedPlace
                                            });
                                            setIdType('Aadhar Card');
                                            setIdFile(null);
                                            setGuests({ adults: 1, children: 0, infants: 0, pets: 0 });
                                            setWhoDropdownOpen(false);
                                            setBookingModal(null);
                                        }}
                                    >
                                        <div className="room-info-top">
                                            <span className="room-status-tag">Available</span>
                                            <span className="room-type-tag">{room.type}</span>
                                        </div>
                                        <div className="room-number-display">Room {room.number}</div>
                                        <div className="room-price-display">₹{Math.floor(room.price)}<span>/night</span></div>
                                        <button className="book-btn-mini">Select Unit</button>
                                    </div>
                                ))}
                            </div>
                            <h3>Commonly Booked</h3>
                            <div className="rooms-grid">
                                {bookingModal.rooms.filter(r => r.status === 'booked').map((room) => (
                                    <div key={room.number} className="room-card booked">
                                        <div className="room-number-display">Room {room.number}</div>
                                        <div className="room-status-tag">Currently Occupied</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Form Modal */}
            {bookingFormModal && (
                <div id="bookingFormModal" className="modal" onClick={(e) => { if (e.target.id === 'bookingFormModal') setBookingFormModal(null) }}>
                    <div className="modal-content booking-modal-content" style={{ maxWidth: 620 }}>
                        <div className="booking-header">
                            <h2>Complete Booking</h2>
                            <span className="close-modal" onClick={() => setBookingFormModal(null)} title="Close">&times;</span>
                        </div>
                        <div className="booking-body">
                            <div className="booking-summary-box">
                                <div className="summary-hotel-info">
                                    <p>Confirming <strong>Room {bookingFormModal.roomNumber}</strong></p>
                                    <p className="summary-hotel-name">{bookingFormModal.hotelName}</p>
                                </div>
                                <div className="summary-price-box">
                                    <span className="summary-price">₹{Math.floor(bookingFormModal.price)}</span>
                                    <span className="summary-per-night">/night</span>
                                </div>
                            </div>
                            <form onSubmit={bookRoom} className="booking-form-premium">
                                <div className="form-group-modern">
                                    <label>Full Guest Name</label>
                                    <input type="text" name="guestName" placeholder="Enter guest's full name" required />
                                </div>
                                <div className="form-group-modern">
                                    <label>Contact Number</label>
                                    <input type="tel" name="contactNumber" placeholder="+91 98765 43210" required />
                                </div>
                                <div className="form-row-modern">
                                    <div className="form-group-modern">
                                        <label>Check-in Date</label>
                                        <input 
                                            type="date" 
                                            name="checkIn" 
                                            min={new Date().toISOString().split('T')[0]} 
                                            required 
                                        />
                                    </div>
                                    <div className="form-group-modern">
                                        <label>Check-out Date</label>
                                        <input 
                                            type="date" 
                                            name="checkOut" 
                                            min={new Date().toISOString().split('T')[0]} 
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="form-group-modern who-dropdown-container" ref={whoDropdownRef}>
                                    <label>Who</label>
                                    <div 
                                        className={`who-dropdown-trigger ${whoDropdownOpen ? 'active' : ''}`}
                                        onClick={() => setWhoDropdownOpen(!whoDropdownOpen)}
                                        tabIndex={0}
                                        role="button"
                                        aria-expanded={whoDropdownOpen}
                                    >
                                        <div className="who-trigger-content">
                                            <i className="fa-solid fa-user-group who-icon"></i>
                                            <span className="who-trigger-text">{getGuestsSummary()}</span>
                                        </div>
                                        <i className={`fa-solid fa-chevron-${whoDropdownOpen ? 'up' : 'down'} who-chevron`}></i>
                                    </div>

                                    {whoDropdownOpen && (
                                        <div className="who-popover-card">
                                            {/* Adults */}
                                            <div className="who-popover-row">
                                                <div className="who-row-info">
                                                    <span className="who-row-title">Adults</span>
                                                    <span className="who-row-subtitle">Ages 13 or above</span>
                                                </div>
                                                <div className="who-stepper">
                                                    <button 
                                                        type="button" 
                                                        className={`stepper-btn ${guests.adults <= 1 ? 'disabled' : ''}`} 
                                                        onClick={() => updateGuestCount('adults', -1)}
                                                        disabled={guests.adults <= 1}
                                                        aria-label="Decrease adults"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="stepper-value">{guests.adults}</span>
                                                    <button 
                                                        type="button" 
                                                        className={`stepper-btn ${guests.adults >= 10 ? 'disabled' : ''}`} 
                                                        onClick={() => updateGuestCount('adults', 1)}
                                                        disabled={guests.adults >= 10}
                                                        aria-label="Increase adults"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Children */}
                                            <div className="who-popover-row">
                                                <div className="who-row-info">
                                                    <span className="who-row-title">Children</span>
                                                    <span className="who-row-subtitle">Ages 2–12</span>
                                                </div>
                                                <div className="who-stepper">
                                                    <button 
                                                        type="button" 
                                                        className={`stepper-btn ${guests.children <= 0 ? 'disabled' : ''}`} 
                                                        onClick={() => updateGuestCount('children', -1)}
                                                        disabled={guests.children <= 0}
                                                        aria-label="Decrease children"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="stepper-value">{guests.children}</span>
                                                    <button 
                                                        type="button" 
                                                        className={`stepper-btn ${guests.children >= 6 ? 'disabled' : ''}`} 
                                                        onClick={() => updateGuestCount('children', 1)}
                                                        disabled={guests.children >= 6}
                                                        aria-label="Increase children"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Infants */}
                                            <div className="who-popover-row">
                                                <div className="who-row-info">
                                                    <span className="who-row-title">Infants</span>
                                                    <span className="who-row-subtitle">Under 2</span>
                                                </div>
                                                <div className="who-stepper">
                                                    <button 
                                                        type="button" 
                                                        className={`stepper-btn ${guests.infants <= 0 ? 'disabled' : ''}`} 
                                                        onClick={() => updateGuestCount('infants', -1)}
                                                        disabled={guests.infants <= 0}
                                                        aria-label="Decrease infants"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="stepper-value">{guests.infants}</span>
                                                    <button 
                                                        type="button" 
                                                        className={`stepper-btn ${guests.infants >= 5 ? 'disabled' : ''}`} 
                                                        onClick={() => updateGuestCount('infants', 1)}
                                                        disabled={guests.infants >= 5}
                                                        aria-label="Increase infants"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Pets */}
                                            <div className="who-popover-row who-popover-row-last">
                                                <div className="who-row-info">
                                                    <span className="who-row-title">Pets</span>
                                                    <span className="who-row-subtitle who-service-link" title="Service animals are always permitted">
                                                        Bringing a service animal?
                                                    </span>
                                                </div>
                                                <div className="who-stepper">
                                                    <button 
                                                        type="button" 
                                                        className={`stepper-btn ${guests.pets <= 0 ? 'disabled' : ''}`} 
                                                        onClick={() => updateGuestCount('pets', -1)}
                                                        disabled={guests.pets <= 0}
                                                        aria-label="Decrease pets"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="stepper-value">{guests.pets}</span>
                                                    <button 
                                                        type="button" 
                                                        className={`stepper-btn ${guests.pets >= 3 ? 'disabled' : ''}`} 
                                                        onClick={() => updateGuestCount('pets', 1)}
                                                        disabled={guests.pets >= 3}
                                                        aria-label="Increase pets"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="who-popover-footer">
                                                <button 
                                                    type="button" 
                                                    className="who-done-btn"
                                                    onClick={() => setWhoDropdownOpen(false)}
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group-modern">
                                    <label>Select ID Document Type</label>
                                    <select 
                                        value={idType} 
                                        onChange={e => setIdType(e.target.value)}
                                        className="filter-input-select"
                                    >
                                        <option value="Aadhar Card">Aadhar Card</option>
                                        <option value="PAN Card">PAN Card</option>
                                        <option value="Passport">Passport</option>
                                        <option value="Driving License">Driving License</option>
                                    </select>
                                </div>
                                <div className="form-group-modern">
                                    <label>Upload ID Proof ({idType})</label>
                                    {!idFile ? (
                                        <div className="upload-zone" onClick={() => document.getElementById('id-proof-input').click()}>
                                            <i className="fa-solid fa-cloud-arrow-up"></i>
                                            <p>Click or drag to upload document</p>
                                            <span>PDF, PNG, JPG (Max 5MB)</span>
                                            <input 
                                                id="id-proof-input" 
                                                type="file" 
                                                accept="image/*,application/pdf" 
                                                style={{ display: 'none' }} 
                                                onChange={handleFileUpload} 
                                                required 
                                            />
                                        </div>
                                    ) : (
                                        <div className="upload-preview-card">
                                            <div className="preview-details">
                                                {idFile.type.startsWith('image/') ? (
                                                    <img src={idFile.dataURL} alt="ID Preview" className="preview-thumb" />
                                                ) : (
                                                    <div className="preview-icon"><i className="fa-solid fa-file-pdf"></i></div>
                                                )}
                                                <div className="preview-meta">
                                                    <span className="file-name">{idFile.name}</span>
                                                    <span className="file-size">{idFile.size}</span>
                                                </div>
                                            </div>
                                            <button type="button" className="remove-file-btn" onClick={() => setIdFile(null)}>
                                                <i className="fa-solid fa-trash"></i> Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="confirm-btn-premium" disabled={bookingInProgress}>
                                    {bookingInProgress ? 'Processing Stay...' : 'Confirm Secure Booking'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Success Modal */}
            {bookingSuccessModal && (
                <div id="bookingSuccessModal" className="modal" onClick={(e) => { if (e.target.id === 'bookingSuccessModal') setBookingSuccessModal(null) }}>
                    <div className="modal-content booking-modal-content" style={{ maxWidth: 550 }}>
                        <div className="booking-header" style={{ justifyContent: 'center', background: 'var(--success-color)' }}>
                            <h2>Booking Confirmed!</h2>
                        </div>
                        <div className="booking-body" style={{ padding: '24px', textAlign: 'center' }}>
                            <div className="success-checkmark-wrapper">
                                <div className="success-checkmark">
                                    <div className="check-icon">
                                        <span className="icon-line line-tip"></span>
                                        <span className="icon-line line-long"></span>
                                        <div className="icon-circle"></div>
                                        <div className="icon-fix"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <h3 style={{ margin: '12px 0 6px', color: 'var(--success-color)', fontSize: '1.4rem', fontWeight: 800 }}>Stay Secured</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>Your reservation has been successfully completed. A confirmation email has been sent to your registered address.</p>
                            
                            <div className="success-receipt-box">
                                <div className="receipt-row">
                                    <span>Hotel</span>
                                    <strong>{bookingSuccessModal.hotelName}</strong>
                                </div>
                                <div className="receipt-row">
                                    <span>Room Number</span>
                                    <strong>Room {bookingSuccessModal.roomNumber}</strong>
                                </div>
                                <div className="receipt-row">
                                    <span>Guest Name</span>
                                    <strong>{bookingSuccessModal.guestName}</strong>
                                </div>
                                <div className="receipt-row">
                                    <span>Who (Guests)</span>
                                    <strong>{getGuestsSummary(bookingSuccessModal.guests)}</strong>
                                </div>
                                <div className="receipt-row">
                                    <span>Check-in Date</span>
                                    <strong>{bookingSuccessModal.checkInDate}</strong>
                                </div>
                                <div className="receipt-row">
                                    <span>Check-out Date</span>
                                    <strong>{bookingSuccessModal.checkOutDate}</strong>
                                </div>
                                <div className="receipt-row">
                                    <span>Rate</span>
                                    <strong>₹{Math.floor(bookingSuccessModal.price)}/night</strong>
                                </div>
                                <div className="receipt-row-divider"></div>
                                <div className="receipt-row document-proof-row">
                                    <span>ID Proof ({bookingSuccessModal.idType})</span>
                                    <div className="proof-attachment">
                                        {bookingSuccessModal.idFile.type.startsWith('image/') ? (
                                            <img src={bookingSuccessModal.idFile.dataURL} alt="ID Document" className="receipt-proof-img" onClick={() => window.open(bookingSuccessModal.idFile.dataURL)} title="Click to view full size" />
                                        ) : (
                                            <div className="receipt-proof-pdf" onClick={() => window.open(bookingSuccessModal.idFile.dataURL)}>
                                                <i className="fa-solid fa-file-pdf"></i>
                                                <span>View ID Document</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <button className="confirm-btn-premium" style={{ width: '100%', marginTop: 20 }} onClick={() => setBookingSuccessModal(null)}>
                                Back to Search
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default Booking;
