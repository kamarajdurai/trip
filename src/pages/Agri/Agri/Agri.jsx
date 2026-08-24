import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, addDoc, updateDoc, increment, serverTimestamp, onSnapshot } from 'firebase/firestore';

import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { usePageTitle } from '../../../hooks';
import '../../../assets/css/style.css';
import './Agri.css';

// Import images from assets
import nilgirisTeaImg from '../../../assets/agri/nilgiris_tea.png';
import valparaiCoffeeImg from '../../../assets/agri/valparai_coffee.png';
import pollachiCoconutImg from '../../../assets/agri/pollachi_coconut.png';
import kodaikanalOrganicImg from '../../../assets/agri/kodaikanal_organic.png';
import villageHomeImg from '../../../assets/agri/village_home.png';
import villageLifeHeroImg from '../../../assets/agri/village_life_hero.png';
import villageActivityImg from '../../../assets/agri/village_activity.png';
import natureBgImg from '../../../assets/agri/nature_bg.png';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Particle Background System (matching Home UI)
class HomeParticle {
    constructor(width, height) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.9;
        this.vy = (Math.random() - 0.5) * 0.9;
        this.size = Math.random() * 1.5 + 0.5;
    }

    update(width, height) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(128, 0, 32, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const agriData = {
    plantations: [
        { id: 1, name: "Nilgiris Tea Estate", location: "Ooty & Coonoor", season: "Year-round", activities: "Tea Tasting, Factory Tour", image: nilgirisTeaImg },
        { id: 2, name: "Valparai Coffee", location: "Anamalai Hills", season: "Oct - Mar", activities: "Coffee Picking, Trekking", image: valparaiCoffeeImg },
        { id: 3, name: "Pollachi Coconut", location: "Coimbatore Dist", season: "Year-round", activities: "Tender Coconut, Bullock Cart", image: pollachiCoconutImg },
        { id: 4, name: "Kodaikanal Organic", location: "Palani Hills", season: "Aug - Dec", activities: "Farm to Table, Planting", image: kodaikanalOrganicImg }
    ],

    // Village Life Data
    villageActivities: [
        { id: 1, category: "Arts", title: "Pottery Making Workshop", price: "₹500", coinCost: 50, duration: "2 Hours", image: villageActivityImg, desc: "Learn to mold clay with Master Potter Kumaran in his traditional studio." },
        { id: 2, category: "Farming", title: "Morning Milking & Feeding", price: "₹200", coinCost: 20, duration: "1 Hour", image: villageActivityImg, desc: "Start your day by connecting with our gentle cows and learning dairy farming." },
        { id: 3, category: "Culture", title: "Folk Dance Performance", price: "₹800", coinCost: 80, duration: "1.5 Hours", image: villageActivityImg, desc: "Enjoy a vibrant evening of Karagattam and Oyilattam by the village troupe." },
        { id: 4, category: "Food", title: "Traditional Mud Pot Cooking", price: "₹1200", coinCost: 120, duration: "3 Hours", image: villageActivityImg, desc: "Cook a full Chettinad meal using earthen pots and firewood stoves." },
        { id: 5, category: "Arts", title: "Handloom Weaving Demo", price: "₹300", coinCost: 30, duration: "1 Hour", image: villageActivityImg, desc: "Watch the intricate process of sari weaving on a traditional handloom." }
    ],

    villageHosts: [
        { id: 1, name: "Lakshmi Amma", role: "Culinary Host", image: villageActivityImg, tags: ["Tamil", "English", "Cooking"] },
        { id: 2, name: "Kumar & Family", role: "Farm Owner", image: villageActivityImg, tags: ["Farming", "Storyteller"] },
        { id: 3, name: "Raja", role: "Artisan Weaver", image: villageActivityImg, tags: ["Weaving", "History"] }
    ]
};

const curatedFarmStays = [
    {
        id: "fs1",
        name: "Laxmi Farm Meadows",
        location: "Salem",
        price: 1800,
        coinCost: 180,
        rating: 4.8,
        image: villageHomeImg,
        activities: "Mango picking, Milking cows, Pottery",
        desc: "A beautiful organic mango farm nestled at the foothills of Yercaud, Salem. Experience traditional hospitality."
    },
    {
        id: "fs2",
        name: "Anamalai Valley Farmstay",
        location: "Pollachi",
        price: 2500,
        coinCost: 250,
        rating: 4.9,
        image: nilgirisTeaImg,
        activities: "Bullock cart rides, Coconut harvesting, Canal swimming",
        desc: "Stay amidst lush coconut groves in Pollachi. Enjoy fresh organic meals cooked on wood fires."
    },
    {
        id: "fs3",
        name: "Nellore Paddy Fields Stay",
        location: "Madurai",
        price: 1500,
        coinCost: 150,
        rating: 4.7,
        image: villageActivityImg,
        activities: "Paddy sowing, Traditional folk music, Bullock carts",
        desc: "A rustic heritage home surrounded by organic paddy fields, just outside Madurai."
    },
    {
        id: "fs4",
        name: "Coonoor Tea Hills Homestay",
        location: "Ooty",
        price: 3200,
        coinCost: 320,
        rating: 4.9,
        image: valparaiCoffeeImg,
        activities: "Tea plucking, Trekking, Campfire",
        desc: "Relax in a vintage bungalow overlooking organic tea gardens in the Nilgiris hills."
    }
];

const organicProducts = [
    { id: 1, name: "Organic Ooty Tea Leaf (250g)", price: 150, coinCost: 15, img: nilgirisTeaImg, desc: "Handpicked premium tea leaves dried organically on Coonoor highlands." },
    { id: 2, name: "Handpicked Valparai Coffee (500g)", price: 300, coinCost: 30, img: valparaiCoffeeImg, desc: "Medium roast robusta coffee beans with rich mountain flavor profiles." },
    { id: 3, name: "Kodaikanal Wild Forest Honey (250ml)", price: 200, coinCost: 20, img: kodaikanalOrganicImg, desc: "Pure organic raw honey harvested from wild hives in Palani valleys." },
    { id: 4, name: "Pollachi Virgin Coconut Oil (1L)", price: 250, coinCost: 25, img: pollachiCoconutImg, desc: "Cold-pressed pure oil made from organically grown premium Pollachi coconuts." }
];

export default function Agri() {
    usePageTitle('Agri & Rural Tourism | Tamil Nadu');
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeSection = searchParams.get('section'); // 'plantation', 'stay', 'village'
    const [activeSubTab, setActiveSubTab] = useState('explore'); // 'explore' | 'market'

    // --- Canvas & Particle Background ---
    const canvasRef = useRef(null);
    const sectionRef = useRef(null);

    // --- Search Logic State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [places, setPlaces] = useState([]);
    const [localStays, setLocalStays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // --- Village State ---
    const [activeCategory, setActiveCategory] = useState('All');

    // --- Wallet / Booking / Market States ---
    const [currentUser, setCurrentUser] = useState(null);
    const [walletSummary, setWalletSummary] = useState({ ecopoints: 0 });
    const [activeBooking, setActiveBooking] = useState(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingGuests, setBookingGuests] = useState(1);
    const [bookingPayment, setBookingPayment] = useState('cash');

    const servicesRef = useRef({ places: null, map: null });
    const mapContainerRef = useRef(null);

    // Subscribe to Wallet & Auth
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                const walletRef = doc(db, 'users', user.uid, 'wallet', 'summary');
                const unsubWallet = onSnapshot(walletRef, (snap) => {
                    if (snap.exists()) {
                        setWalletSummary(snap.data());
                    }
                });
                return () => unsubWallet();
            } else {
                setWalletSummary({ ecopoints: 0 });
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Particle Background System (matching Home UI)
    useEffect(() => {
        const canvas = canvasRef.current;
        const section = sectionRef.current;
        if (!canvas || !section) return;

        const ctx = canvas.getContext('2d', { alpha: true });

        const updateSize = () => {
            canvas.width = section.offsetWidth;
            canvas.height = section.offsetHeight;
        };
        updateSize();

        let particles = [];
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 18 : 35;
        let animationFrameId;
        let isVisible = false;

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new HomeParticle(canvas.width, canvas.height));
            }
        };

        const animateParticles = () => {
            if (!isVisible) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const len = particles.length;
            for (let i = 0; i < len; i++) {
                particles[i].update(canvas.width, canvas.height);
                particles[i].draw(ctx);

                for (let j = i + 1; j < len; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < 6400) {
                        const distance = Math.sqrt(distSq);
                        ctx.strokeStyle = `rgba(128, 0, 32, ${0.12 - distance / 800})`;
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

        const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = requestAnimationFrame(animateParticles);
            } else {
                cancelAnimationFrame(animationFrameId);
            }
        }, { threshold: 0.05 });

        observer.observe(section);

        const handleResize = () => {
            updateSize();
            initParticles();
        };

        window.addEventListener('resize', handleResize, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Load Google Maps Script
    useEffect(() => {
        if (!activeSection || activeSection === 'support') return;

        const loadScript = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                setScriptLoaded(true);
                return;
            }
            if (document.querySelector(`script[src*="${GOOGLE_API_KEY}"]`)) {
                const timer = setInterval(() => {
                    if (window.google && window.google.maps) {
                        setScriptLoaded(true);
                        clearInterval(timer);
                    }
                }, 500);
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => setScriptLoaded(true);
            document.head.appendChild(script);
        };

        if (GOOGLE_API_KEY) loadScript();
    }, [activeSection]);

    // Init Services
    useEffect(() => {
        if (scriptLoaded && !servicesRef.current.places) {
            const mapDiv = document.createElement('div');
            const map = new window.google.maps.Map(mapDiv, { center: { lat: 11.1271, lng: 78.6569 }, zoom: 7 });
            servicesRef.current.map = map;
            servicesRef.current.places = new window.google.maps.places.PlacesService(map);
        }
    }, [scriptLoaded]);

    // Interactive Google Map Trail
    useEffect(() => {
        if (scriptLoaded && activeSection === 'village' && activeSubTab === 'explore' && mapContainerRef.current) {
            const mapOptions = {
                center: { lat: 10.7905, lng: 78.7047 },
                zoom: 7
            };
            const map = new window.google.maps.Map(mapContainerRef.current, mapOptions);

            const locations = [
                { name: "Nilgiris Tea Estate Trail", lat: 11.4102, lng: 76.6950, activities: "Tea Tasting, Factory Tour", cost: 150 },
                { name: "Valparai Coffee Picking Trail", lat: 10.3737, lng: 76.9558, activities: "Coffee Picking, Trekking", cost: 200 },
                { name: "Pollachi Coconut Farm Trail", lat: 10.6589, lng: 77.0082, activities: "Tender Coconut, Bullock Cart", cost: 100 },
                { name: "Kodaikanal Organic Farm Trail", lat: 10.2381, lng: 77.4892, activities: "Farm to Table, Planting", cost: 250 }
            ];

            locations.forEach(loc => {
                const marker = new window.google.maps.Marker({
                    position: { lat: loc.lat, lng: loc.lng },
                    map: map,
                    title: loc.name,
                    icon: {
                        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    }
                });

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="color: black; padding: 5px; font-family: sans-serif; min-width: 150px;">
                            <h4 style="margin: 0 0 5px 0; color: #800020;">${loc.name}</h4>
                            <p style="margin: 0 0 8px 0; font-size: 0.8rem;"><strong>Activities:</strong> ${loc.activities}</p>
                            <p style="margin: 0 0 10px 0; font-size: 0.8rem;"><strong>Cost:</strong> ₹${loc.cost} or ${loc.cost / 10} Coins</p>
                            <button id="book-trail-${loc.cost}" style="background: #800020; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold; width: 100%;">Book Visit</button>
                        </div>
                    `
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                    setTimeout(() => {
                        const btn = document.getElementById(`book-trail-${loc.cost}`);
                        if (btn) {
                            btn.onclick = () => {
                                setActiveBooking({
                                    type: 'plantation',
                                    item: {
                                        title: loc.name,
                                        hostName: 'Local Estate Manager',
                                        price: loc.cost,
                                        image: nilgirisTeaImg
                                    }
                                });
                            };
                        }
                    }, 200);
                });
            });
        }
    }, [scriptLoaded, activeSection, activeSubTab]);

    // Handle Search
    const handleSearch = () => {
        if (!searchTerm.trim()) return;
        if (!servicesRef.current.places) {
            setError('Maps service loading...');
            return;
        }

        setLoading(true);
        setError('');
        setPlaces([]);
        setLocalStays([]);

        // Check local database for stays
        if (activeSection === 'stay') {
            const matches = curatedFarmStays.filter(stay => 
                stay.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
                searchTerm.toLowerCase().includes(stay.location.toLowerCase()) ||
                stay.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setLocalStays(matches);
        }

        let query = '';
        if (activeSection === 'stay') {
            query = searchTerm.includes('Tamil Nadu') ? `${searchTerm} farm stay resort` : `${searchTerm} farm stay resort in Tamil Nadu`;
        } else if (activeSection === 'village') {
            let categoryTerm = '';
            switch (activeCategory) {
                case 'Arts': categoryTerm = 'Arts and Crafts'; break;
                case 'Farming': categoryTerm = 'Farm visits'; break;
                case 'Culture': categoryTerm = 'Cultural centers temples'; break;
                case 'Food': categoryTerm = 'Traditional food'; break;
                default: categoryTerm = 'Village tourism';
            }
            query = searchTerm.includes('Tamil Nadu') ? `${categoryTerm} in ${searchTerm}` : `${categoryTerm} in ${searchTerm}, Tamil Nadu`;
        } else {
            query = searchTerm.includes('Tamil Nadu') ? searchTerm : `${searchTerm} in Tamil Nadu`;
        }

        const request = {
            query: query,
            fields: ['name', 'geometry', 'photos', 'formatted_address', 'rating', 'place_id']
        };

        servicesRef.current.places.textSearch(request, (results, status) => {
            setLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                setPlaces(results);
            } else {
                if (localStays.length === 0) {
                    setError('No results found. Try broader terms or a different location.');
                }
            }
        });
    };

    const handleCardClick = (placeId) => {
        if (!servicesRef.current.places) return;
        const request = {
            placeId: placeId,
            fields: ['name', 'formatted_address', 'formatted_phone_number', 'photos', 'rating', 'website', 'url', 'editorial_summary', 'geometry']
        };
        servicesRef.current.places.getDetails(request, (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                setSelectedPlace(place);
            }
        });
    };

    const getPhotoUrl = (photo, maxWidth = 400) => {
        if (photo && typeof photo.getUrl === 'function') {
            return photo.getUrl({ maxWidth });
        }
        return nilgirisTeaImg;
    };

    const handleSelect = (topic) => {
        setSearchParams({ section: topic });
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        setSearchParams({});
        setPlaces([]);
        setLocalStays([]);
        setSearchTerm('');
        setActiveSubTab('explore');
    };

    const handleConfirmBooking = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Please login to make bookings.");
            navigate('/login');
            return;
        }

        const costInCoins = activeBooking.item.price ? Math.ceil(activeBooking.item.price / 10) : 10;
        const totalCostInCoins = costInCoins * bookingGuests;
        const totalCostInCash = (activeBooking.item.price || 100) * bookingGuests;

        if (bookingPayment === 'coins' && walletSummary.ecopoints < totalCostInCoins) {
            alert(`Insufficient Eco Coins! You need ${totalCostInCoins} coins but only have ${walletSummary.ecopoints}.`);
            return;
        }

        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'bookings'), {
                experienceTitle: activeBooking.item.title || activeBooking.item.name,
                hostName: activeBooking.item.hostName || activeBooking.item.name,
                bookingDate,
                numberOfGuests: Number(bookingGuests),
                totalAmount: bookingPayment === 'coins' ? totalCostInCoins : totalCostInCash,
                paymentMethod: bookingPayment,
                category: 'Agri & Rural Tourism',
                status: 'confirmed',
                bookedAt: serverTimestamp()
            });

            if (bookingPayment === 'coins') {
                const walletRef = doc(db, 'users', currentUser.uid, 'wallet', 'summary');
                await updateDoc(walletRef, {
                    ecopoints: increment(-totalCostInCoins),
                    points: increment(-totalCostInCoins)
                });

                await addDoc(collection(db, 'users', currentUser.uid, 'wallet', 'transactions'), {
                    amount: totalCostInCoins,
                    type: 'debit',
                    description: `Booked: ${activeBooking.item.title || activeBooking.item.name}`,
                    category: 'redemption',
                    timestamp: serverTimestamp()
                });
            }

            alert("🎉 Booking Confirmed Successfully!");
            setActiveBooking(null);
            setBookingGuests(1);
            setBookingDate('');
            setBookingPayment('cash');
        } catch (err) {
            console.error("Booking error:", err);
            alert("Failed to complete booking. Please try again.");
        }
    };

    const handleBuyProduct = async (product, paymentType) => {
        if (!currentUser) {
            alert("Please login to buy products.");
            navigate('/login');
            return;
        }

        if (paymentType === 'coins' && walletSummary.ecopoints < product.coinCost) {
            alert(`Insufficient Eco Coins! You need ${product.coinCost} coins but only have ${walletSummary.ecopoints}.`);
            return;
        }

        if (!window.confirm(`Purchase ${product.name} using ${paymentType === 'coins' ? `${product.coinCost} Eco Coins` : `₹${product.price}`}?`)) {
            return;
        }

        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'orders'), {
                productName: product.name,
                productId: product.id,
                cost: paymentType === 'coins' ? product.coinCost : product.price,
                paymentMethod: paymentType,
                category: 'Agri Organic Market',
                orderedAt: serverTimestamp()
            });

            if (paymentType === 'coins') {
                const walletRef = doc(db, 'users', currentUser.uid, 'wallet', 'summary');
                await updateDoc(walletRef, {
                    ecopoints: increment(-product.coinCost),
                    points: increment(-product.coinCost)
                });

                await addDoc(collection(db, 'users', currentUser.uid, 'wallet', 'transactions'), {
                    amount: product.coinCost,
                    type: 'debit',
                    description: `Purchased product: ${product.name}`,
                    category: 'redemption',
                    timestamp: serverTimestamp()
                });
            }

            alert(`🎉 Order Placed Successfully! Your package will be shipped shortly.`);
        } catch (err) {
            console.error("Order error:", err);
            alert("Failed to place order. Please try again.");
        }
    };

    const filteredActivities = activeCategory === 'All'
        ? agriData.villageActivities
        : agriData.villageActivities.filter(a => a.category === activeCategory);

    return (
        <div className="agri-home-themed-page">
            <Navbar />

            {/* Hero Section — Stitch Cinematic Style (Matching Home UI) */}
            <section className="stitch-hero">
                <div className="stitch-hero__bg">
                    <picture>
                        <source media="(max-width: 768px)" srcSet="/tn verse/src/agri.webp" />
                        <img
                            src="/tn verse/src/agri.webp"
                            alt="Tamil Nadu Agriculture and Rural Landscapes"
                            className="stitch-hero__img"
                            width="1920"
                            height="1080"
                            fetchPriority="high"
                            decoding="async"
                        />
                    </picture>
                    <div className="stitch-hero__overlay"></div>
                </div>

                <div className="stitch-hero__content">
                    <h1 className="stitch-hero__title">
                        Tamil Nadu Agri Tourism - <br />
                        <span className="stitch-hero__title-italic">Breathe the Soil, Relive the Roots</span>
                    </h1>

                    <div className="stitch-hero__buttons">
                        <button
                            className="stitch-hero__btn stitch-hero__btn--ar"
                            onClick={() => {
                                handleSelect('plantation');
                                document.getElementById('agri-dashboard-start')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <span className="material-symbols-outlined">forest</span>
                            <span>EXPLORE FARMS</span>
                        </button>
                        <button
                            className="stitch-hero__btn stitch-hero__btn--vr"
                            onClick={() => {
                                handleSelect('stay');
                                document.getElementById('agri-dashboard-start')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <span className="material-symbols-outlined">cottage</span>
                            <span>FARM STAYS</span>
                        </button>
                        <button
                            className="stitch-hero__btn stitch-hero__btn--vr"
                            onClick={() => {
                                handleSelect('village');
                                document.getElementById('agri-dashboard-start')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <span className="material-symbols-outlined">holiday_village</span>
                            <span>VILLAGE LIFE</span>
                        </button>
                    </div>
                </div>

                <div className="stitch-hero__scroll-hint" onClick={() => document.getElementById('agri-dashboard-start')?.scrollIntoView({ behavior: 'smooth' })}>
                    <span className="stitch-hero__scroll-text">Scroll to Discover</span>
                    <span className="material-symbols-outlined stitch-hero__scroll-icon">expand_more</span>
                </div>
            </section>

            {/* Quick Stats Trust Banner (Matching Home UI) */}
            <section className="tn-stats-banner" style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', padding: '26px 20px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(129,0,0,0.08)', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>40+</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Organic Plantations</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>150+</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Village Homestays</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>25,000+</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Happy Travelers</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>4.9 ★</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Authentic Rating</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>100%</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Direct Farmer Benefit</div>
                </div>
            </section>

            {/* Main Content with Unified Particle Background */}
            <main id="agri-dashboard-start" className="main-content-wrapper agri-content-wrapper" ref={sectionRef}>
                <canvas ref={canvasRef} id="particleCanvas"></canvas>
                <div className="cursor-glow"></div>

                <div className="agri-page-inner">
                    {!activeSection ? (
                        <div className="landing-dashboard">
                            {/* Panel 1: Explore Our Farms */}
                            <div className="dashboard-panel">
                                <div className="panel-header">
                                    <h2>Explore Our Farms</h2>
                                </div>
                                <div className="plantation-grid">
                                    {agriData.plantations.map(p => (
                                        <div key={p.id} className="plantation-card" onClick={() => handleSelect('plantation')}>
                                            <img src={p.image} className="plantation-img" alt={p.name} />
                                            <div className="plantation-overlay">
                                                <h3>{p.name}</h3>
                                                <p>{p.location}</p>
                                                <p className="season">Best: {p.season}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="panel-footer">
                                    <button className="btn-green" onClick={() => handleSelect('plantation')}>View Details ›</button>
                                    <button className="btn-wood" onClick={() => handleSelect('plantation')}>Book a Visit ›</button>
                                </div>
                            </div>

                            {/* Panel 2: Stay with Farmers */}
                            <div className="dashboard-panel">
                                <div className="panel-header">
                                    <h2>Stay with Farmers</h2>
                                </div>
                                <div className="stay-hero">
                                    <img src={villageHomeImg} alt="Chettinad Village Home" />
                                </div>
                                <div className="stay-features">
                                    <span className="feature-pill">🍲 Home-cooked Meals</span>
                                    <span className="feature-pill">🌿 Eco-friendly</span>
                                    <span className="feature-pill">👨‍👩‍👧 Family Friendly</span>
                                </div>
                                <div className="stay-pricing">
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>From ₹2500 / Night</span>
                                    <button className="btn-green" onClick={() => handleSelect('stay')}>Check Availability</button>
                                    <button className="btn-wood" onClick={() => handleSelect('stay')}>Book Now</button>
                                </div>
                            </div>

                            {/* Panel 3: Experience Village Life */}
                            <div className="dashboard-panel">
                                <div className="panel-header">
                                    <h2>Experience Village Life</h2>
                                </div>
                                <div className="stay-features" style={{ margin: '15px 0' }}>
                                    <span className="feature-pill">🏺 Pottery making</span>
                                    <span className="feature-pill">🐂 Bullock Ride</span>
                                    <span className="feature-pill">🧵 Handloom Weave</span>
                                </div>
                                <img src={villageLifeHeroImg} className="village-scene" alt="Village Life" style={{ maxHeight: '250px', objectFit: 'cover', borderRadius: '15px' }} />
                                <div className="panel-footer" style={{ marginTop: '20px' }}>
                                    <button className="btn-green" onClick={() => handleSelect('village')}>View Activities ›</button>
                                    <button className="btn-wood" onClick={() => handleSelect('village')}>Book Experience ›</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="detail-container">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <button className="btn-wood" onClick={handleBack}>← Back to Dashboard</button>
                                {currentUser && (
                                    <div className="wallet-pill-agri" style={{ background: '#800020', color: 'white', padding: '8px 18px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(128,0,32,0.2)' }}>
                                        <i className="fa-solid fa-coins"></i> Wallet: {walletSummary.ecopoints} Coins
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '20px', animation: 'fadeIn 0.5s' }}>
                                {/* SEARCH ENABLED PLANTATION VIEW */}
                                {activeSection === 'plantation' && (
                                    <div className="dashboard-panel" style={{ padding: '30px', minHeight: '600px' }}>
                                        <div className="panel-header" style={{ marginBottom: '30px', borderRadius: '12px' }}>
                                            <h2>Find Farms & Estates</h2>
                                        </div>

                                        <div className="search-container">
                                            <div className="search-input-wrapper">
                                                <i className="fa-solid fa-search search-icon"></i>
                                                <input
                                                    type="text"
                                                    className="search-input"
                                                    placeholder='Search farms (e.g. "Coffee Estate Valparai")'
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                />
                                            </div>
                                            <button className="search-btn" onClick={handleSearch} disabled={loading}>
                                                {loading ? 'Searching...' : 'Search'}
                                            </button>
                                        </div>

                                        {error && <div className="error-state"><p>{error}</p></div>}

                                        {!loading && places.length === 0 && !error && (
                                            <div>
                                                <h3 style={{ marginBottom: '20px', color: '#666', fontFamily: 'Merriweather' }}>Featured Destinations</h3>
                                                <div className="places-grid">
                                                    {agriData.plantations.map(p => (
                                                        <div key={p.id} className="place-card" onClick={() => setSearchTerm(p.name + " " + p.location)}>
                                                            <img src={p.image} className="place-image" alt={p.name} />
                                                            <div className="place-content">
                                                                <h3 className="place-name">{p.name}</h3>
                                                                <p className="place-address">{p.location}</p>
                                                                <div className="place-meta">
                                                                    <span>{p.activities}</span>
                                                                    <span style={{ color: '#800020', fontWeight: 'bold' }}>Featured</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="places-grid">
                                            {places.map(place => (
                                                <div key={place.place_id} className="place-card" onClick={() => handleCardClick(place.place_id)}>
                                                    <img src={getPhotoUrl(place.photos?.[0])} className="place-image" alt={place.name} />
                                                    <div className="place-content">
                                                        <h3 className="place-name">{place.name}</h3>
                                                        <p className="place-address">{place.formatted_address}</p>
                                                        <div className="place-meta">
                                                            <div className="place-rating">★ {place.rating || 'N/A'}</div>
                                                            <button className="btn-green" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveBooking({
                                                                    type: 'plantation',
                                                                    item: {
                                                                        title: place.name,
                                                                        hostName: 'Local Estate Manager',
                                                                        price: 200,
                                                                        image: getPhotoUrl(place.photos?.[0])
                                                                    }
                                                                });
                                                            }}>Book Visit</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SEARCH ENABLED STAY VIEW */}
                                {activeSection === 'stay' && (
                                    <div className="dashboard-panel" style={{ padding: '30px', minHeight: '600px' }}>
                                        <div className="panel-header" style={{ marginBottom: '30px', borderRadius: '12px' }}>
                                            <h2>Find Farm Stays & Resorts</h2>
                                        </div>

                                        <div className="search-container">
                                            <div className="search-input-wrapper">
                                                <i className="fa-solid fa-search search-icon"></i>
                                                <input
                                                    type="text"
                                                    className="search-input"
                                                    placeholder='Search stays (e.g. "Salem", "Pollachi", "Ooty")'
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                />
                                            </div>
                                            <button className="search-btn" onClick={handleSearch} disabled={loading}>
                                                {loading ? 'Searching...' : 'Find Stays'}
                                            </button>
                                        </div>

                                        {error && <div className="error-state"><p>{error}</p></div>}

                                        {/* Curated Village Farm Stays based on searched place */}
                                        {localStays.length > 0 && (
                                            <div style={{ marginBottom: '30px', padding: '0 10px' }}>
                                                <h3 style={{ marginBottom: '20px', color: '#800020', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Merriweather' }}>
                                                    🌿 Curated Village Farm Stays in {searchTerm}
                                                </h3>
                                                <div className="places-grid">
                                                    {localStays.map(stay => (
                                                        <div key={stay.id} className="place-card" style={{ border: '2px solid #800020', position: 'relative' }} onClick={() => setActiveBooking({
                                                            type: 'stay',
                                                            item: {
                                                                title: stay.name,
                                                                hostName: stay.name + ' Manager',
                                                                price: stay.price,
                                                                image: stay.image
                                                            }
                                                        })}>
                                                            <div className="eco-badge" style={{ background: '#800020', color: 'white', position: 'absolute', top: '10px', right: '10px' }}>🌿 Curated Stay</div>
                                                            <img src={stay.image} className="place-image" alt={stay.name} />
                                                            <div className="place-content">
                                                                <h3 className="place-name">{stay.name}</h3>
                                                                <p className="place-address">{stay.desc}</p>
                                                                <div style={{ margin: '10px 0', fontSize: '0.85rem', color: '#666' }}>
                                                                    <strong>Farming Activities:</strong> {stay.activities}
                                                                </div>
                                                                <div className="place-meta" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                                                    <div className="place-rating">★ {stay.rating}</div>
                                                                    <span style={{ fontWeight: 'bold', color: '#800020' }}>₹{stay.price}/night</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {!loading && places.length === 0 && localStays.length === 0 && !error && (
                                            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                                <img src={villageHomeImg} style={{ maxWidth: '100%', borderRadius: '14px', height: '300px', objectFit: 'cover' }} alt="Stay" />
                                                <p style={{ marginTop: '20px', color: '#666' }}>Enter a location to find authentic farm stays and rustic resorts.</p>
                                            </div>
                                        )}

                                        {/* Other Nearby Stays from Google Places */}
                                        {places.length > 0 && (
                                            <div style={{ padding: '0 10px' }}>
                                                <h3 style={{ marginBottom: '20px', color: '#666', fontFamily: 'Merriweather' }}>
                                                    {localStays.length > 0 ? "Other Stays Nearby" : "Stays Found Nearby"}
                                                </h3>
                                                <div className="places-grid">
                                                    {places.map(place => (
                                                        <div key={place.place_id} className="place-card" onClick={() => handleCardClick(place.place_id)}>
                                                            <img src={getPhotoUrl(place.photos?.[0])} className="place-image" alt={place.name} />
                                                            <div className="place-content">
                                                                <h3 className="place-name">{place.name}</h3>
                                                                <p className="place-address">{place.formatted_address}</p>
                                                                <div className="place-meta">
                                                                    <div className="place-rating">★ {place.rating || 'N/A'}</div>
                                                                    <button className="btn-green" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveBooking({
                                                                            type: 'stay',
                                                                            item: {
                                                                                title: place.name,
                                                                                hostName: 'Resort Host',
                                                                                price: 2500,
                                                                                image: getPhotoUrl(place.photos?.[0])
                                                                            }
                                                                        });
                                                                    }}>Book Stay</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* VILLAGE LIFE VIEW WITH MAP & MARKET SUBTABS */}
                                {activeSection === 'village' && (
                                    <div className="dashboard-panel" style={{ padding: '35px', minHeight: '800px' }}>
                                        <div className="panel-header" style={{ marginBottom: '20px', borderRadius: '12px' }}>
                                            <h2>Experience Village Life</h2>
                                        </div>

                                        <div className="agri-sub-tabs" style={{ display: 'flex', gap: '15px', marginBottom: '35px', justifyContent: 'center' }}>
                                            <button className={`sub-tab-btn ${activeSubTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveSubTab('explore')}>Explore Experiences</button>
                                            <button className={`sub-tab-btn ${activeSubTab === 'market' ? 'active' : ''}`} onClick={() => setActiveSubTab('market')}>Organic Marketplace</button>
                                        </div>

                                        {activeSubTab === 'explore' ? (
                                            <>
                                                <div className="category-browser">
                                                    {['All', 'Arts', 'Farming', 'Culture', 'Food'].map(cat => (
                                                        <button
                                                            key={cat}
                                                            className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                                                            onClick={() => setActiveCategory(cat)}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="search-container" style={{ maxWidth: '500px', marginBottom: '40px' }}>
                                                    <div className="search-input-wrapper">
                                                        <i className="fa-solid fa-search search-icon"></i>
                                                        <input
                                                            type="text"
                                                            className="search-input"
                                                            placeholder={`Search ${activeCategory === 'All' ? 'Activities' : activeCategory} (e.g. "Chettinad")`}
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                        />
                                                    </div>
                                                    <button className="search-btn" onClick={handleSearch} disabled={loading}>
                                                        {loading ? 'Searching...' : 'Explore'}
                                                    </button>
                                                </div>

                                                {error && <div className="error-state"><p>{error}</p></div>}

                                                {places.length > 0 ? (
                                                    <div style={{ marginTop: '30px' }}>
                                                        <h3 style={{ marginBottom: '20px', fontFamily: 'Merriweather' }}>
                                                            Found {places.length} experiences in "{searchTerm}"
                                                        </h3>
                                                        <div className="places-grid">
                                                            {places.map(place => (
                                                                <div key={place.place_id} className="place-card" onClick={() => handleCardClick(place.place_id)}>
                                                                    <img src={getPhotoUrl(place.photos?.[0])} className="place-image" alt={place.name} />
                                                                    <div className="place-content">
                                                                        <h3 className="place-name">{place.name}</h3>
                                                                        <p className="place-address">{place.formatted_address}</p>
                                                                        <div className="place-meta">
                                                                            <div className="place-rating">★ {place.rating || 'N/A'}</div>
                                                                            <button className="btn-green" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveBooking({
                                                                                    type: 'activity',
                                                                                    item: {
                                                                                        title: place.name,
                                                                                        hostName: 'Local Village Artisan',
                                                                                        price: 400,
                                                                                        image: getPhotoUrl(place.photos?.[0])
                                                                                    }
                                                                                });
                                                                            }}>Book Experience</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                                            <button className="btn-wood" onClick={() => setPlaces([])}>Clear Search & Show Standard Trials</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    !loading && (
                                                        <div className="animate-fade-in">
                                                            <div className="activity-grid">
                                                                {filteredActivities.map(act => (
                                                                    <div key={act.id} className="activity-card">
                                                                        <div className="eco-badge">🌿 Eco-Friendly</div>
                                                                        <img src={act.image} className="activity-img" alt={act.title} />
                                                                        <div className="activity-content">
                                                                            <div className="activity-header">
                                                                                <h3 className="activity-title">{act.title}</h3>
                                                                                <span className="activity-price">{act.price}</span>
                                                                            </div>
                                                                            <p className="activity-details">{act.desc}</p>
                                                                            <div className="activity-meta">
                                                                                <span>⏱ {act.duration}</span>
                                                                                <span>👥 Small Groups</span>
                                                                                <span>⭐ 4.9</span>
                                                                            </div>
                                                                            <button className="btn-green" style={{ width: '100%', marginTop: 'auto' }} onClick={() => setActiveBooking({
                                                                                type: 'activity',
                                                                                item: {
                                                                                    title: act.title,
                                                                                    hostName: 'Local Village Artisan',
                                                                                    price: Number(act.price.replace('₹', '')) || 500,
                                                                                    image: act.image
                                                                                }
                                                                            })}>Book Experience</button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div className="village-trails-hosts-wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '50px' }}>
                                                                <div className="village-map-container-wrap" style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(128,0,32,0.1)', backdropFilter: 'blur(10px)' }}>
                                                                    <h3 style={{ margin: '0 0 15px 0', fontFamily: 'Merriweather', color: '#800020' }}>🗺️ Google Interactive Trails Map</h3>
                                                                    <div ref={mapContainerRef} style={{ width: '100%', height: '350px', borderRadius: '12px', background: '#e5e7eb' }}></div>
                                                                </div>

                                                                <div>
                                                                    <h3 className="timeline-title" style={{ textAlign: 'left', marginBottom: '20px', color: '#800020', fontFamily: 'Merriweather' }}>Meet Your Hosts</h3>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                                        {agriData.villageHosts.map(host => (
                                                                            <div key={host.id} style={{ display: 'flex', gap: '15px', background: 'rgba(255, 255, 255, 0.9)', padding: '15px', borderRadius: '14px', border: '1px solid rgba(128,0,32,0.1)', backdropFilter: 'blur(10px)' }}>
                                                                                <img src={host.image} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} alt={host.name} />
                                                                                <div>
                                                                                    <h4 style={{ margin: '0 0 5px', fontFamily: 'Merriweather', color: '#333' }}>{host.name}</h4>
                                                                                    <span style={{ color: '#800020', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{host.role}</span>
                                                                                    <div style={{ marginTop: '8px' }}>
                                                                                        {host.tags.map(tag => (
                                                                                            <span key={tag} style={{ background: '#f8ecee', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', marginRight: '6px', color: '#800020', fontWeight: '600' }}>{tag}</span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </>
                                        ) : (
                                            /* Organic Marketplace View */
                                            <div className="marketplace-container animate-fade-in">
                                                <h3 style={{ marginBottom: '10px', fontFamily: 'Merriweather', color: '#800020', fontSize: '1.4rem' }}>🛒 Farm-to-Table Marketplace</h3>
                                                <p style={{ color: '#666', marginBottom: '30px' }}>Support local farmers directly. Purchase organic items using standard money or your earned Eco Coins!</p>
                                                <div className="organic-products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
                                                    {organicProducts.map(prod => (
                                                        <div key={prod.id} className="product-card-agri" style={{ background: 'white', border: '1px solid rgba(128,0,32,0.12)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                                                            <img src={prod.img} alt={prod.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                                                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontFamily: 'Merriweather', color: '#333' }}>{prod.name}</h4>
                                                                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px', flex: 1, lineHeight: '1.45' }}>{prod.desc}</p>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontWeight: 'bold' }}>
                                                                    <span style={{ color: '#333', fontSize: '1.1rem' }}>₹{prod.price}</span>
                                                                    <span style={{ color: '#800020' }}>{prod.coinCost} Coins</span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                                    <button className="btn-wood" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }} onClick={() => handleBuyProduct(prod, 'cash')}>Buy Cash</button>
                                                                    <button className="btn-green" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }} onClick={() => handleBuyProduct(prod, 'coins')} disabled={walletSummary.ecopoints < prod.coinCost}>Buy Coins</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* DETAILS MODAL */}
                            {selectedPlace && (
                                <div className="modal-overlay" onClick={() => setSelectedPlace(null)}>
                                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                                        <button className="close-modal" onClick={() => setSelectedPlace(null)}>&times;</button>
                                        <img
                                            src={getPhotoUrl(selectedPlace.photos?.[0], 800)}
                                            className="modal-header-image"
                                            alt={selectedPlace.name}
                                        />
                                        <div className="modal-body">
                                            <h2 className="modal-title">{selectedPlace.name}</h2>
                                            <p style={{ color: '#666', fontStyle: 'italic' }}>{selectedPlace.formatted_address}</p>

                                            <div className="info-grid">
                                                <div className="info-item">
                                                    <div className="info-icon">⭐</div>
                                                    <div><h4>Rating</h4><p>{selectedPlace.rating} / 5</p></div>
                                                </div>
                                                {selectedPlace.formatted_phone_number && (
                                                    <div className="info-item">
                                                        <div className="info-icon">📞</div>
                                                        <div><h4>Phone</h4><p>{selectedPlace.formatted_phone_number}</p></div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="gallery-grid">
                                                {selectedPlace.photos?.slice(1, 5).map((photo, i) => (
                                                    <img key={i} src={getPhotoUrl(photo, 300)} className="gallery-img" alt="Gallery" />
                                                ))}
                                            </div>

                                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                                <a
                                                    href={selectedPlace.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn-wood"
                                                    style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                                                >
                                                    Maps Link
                                                </a>
                                                <button className="btn-green" style={{ flex: 1 }} onClick={() => {
                                                    setActiveBooking({
                                                        type: 'stay',
                                                        item: {
                                                            title: selectedPlace.name,
                                                            hostName: 'Local Farm Manager',
                                                            price: 1500,
                                                            image: getPhotoUrl(selectedPlace.photos?.[0])
                                                        }
                                                    });
                                                    setSelectedPlace(null);
                                                }}>Book Farm Stay</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* EXPERIENCE BOOKING FORM MODAL */}
                            {activeBooking && (
                                <div className="modal-overlay" onClick={() => setActiveBooking(null)}>
                                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                                        <div className="booking-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                                            <h2 style={{ fontFamily: 'Merriweather', margin: 0, color: '#800020' }}>Confirm Booking</h2>
                                            <button className="close-modal" onClick={() => setActiveBooking(null)}>&times;</button>
                                        </div>
                                        <form onSubmit={handleConfirmBooking}>
                                            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #eee' }}>
                                                <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#666', textTransform: 'uppercase' }}>Selected Activity</p>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'Merriweather', color: '#333' }}>{activeBooking.item.title || activeBooking.item.name}</h4>
                                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#800020', fontWeight: 'bold' }}>Host: {activeBooking.item.hostName}</p>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Date of Visit</label>
                                                    <input type="date" required value={bookingDate} onChange={e => setBookingDate(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Number of Guests</label>
                                                    <input type="number" min="1" max="10" required value={bookingGuests} onChange={e => setBookingGuests(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Payment Mode</label>
                                                    <select value={bookingPayment} onChange={e => setBookingPayment(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
                                                        <option value="cash">Pay Cash at Venue (₹{(activeBooking.item.price || 100) * bookingGuests})</option>
                                                        <option value="coins">Pay with Eco Coins ({Math.ceil((activeBooking.item.price || 100) / 10) * bookingGuests} Coins)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <button type="submit" className="btn-green" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>Confirm & Book Visit</button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <Footer />
            </main>
        </div>
    );
}


