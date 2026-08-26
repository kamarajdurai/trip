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

const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

const getDayAfterTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
};

const curatedFarmStays = [
    {
        id: "fs_pollachi",
        name: "Anamalai Valley Coconut & River Farmstay",
        district: "Pollachi",
        region: "Kongu Agro Belt (Coimbatore Dist)",
        price: 2400,
        coinCost: 240,
        rating: 4.9,
        reviewsCount: 128,
        image: pollachiCoconutImg,
        gallery: [pollachiCoconutImg, villageHomeImg, natureBgImg],
        desc: "A lush 15-acre organic coconut and nutmeg grove situated along the Anamalai river canal. Home to native Kangeyam cows, traditional irrigation wells, and authentic Kongu farm dining.",
        farmer: {
            name: "Raman & Soundarya",
            experience: "3rd Generation Organic Farmer (38 yrs)",
            avatar: villageActivityImg,
            languages: ["Tamil", "English", "Malayalam"],
            bio: "We take pride in our zero-chemical farm. We love teaching visitors how to milk our cows, harvest tender coconuts, and swim in our freshwater farm well."
        },
        rooms: [
            { id: "r1", name: "Heritage Thinnai Courtyard Suite", type: "Courtyard Suite", price: 2800, coinCost: 280, capacity: "2-3 Guests", bed: "King Bed", ac: true, desc: "Traditional Athangudi tiled room with open inner courtyard and teak swing verandah.", img: villageHomeImg },
            { id: "r2", name: "Eco Mud-Brick Chalet", type: "Mud Chalet", price: 2200, coinCost: 220, capacity: "2 Guests", bed: "Queen Bed", ac: false, desc: "Naturally cool red-soil cottage with open-to-sky shower and garden hammock.", img: pollachiCoconutImg },
            { id: "r3", name: "Orchard Glamping Bell Tent", type: "Glamping Tent", price: 1800, coinCost: 180, capacity: "2 Guests", bed: "Plush Mattress", ac: false, desc: "Safari tent under coconut palms with private outdoor campfire area.", img: natureBgImg }
        ],
        amenities: ["Well Swimming", "3 Meals Included", "Wi-Fi", "AC Available", "Pet Friendly", "Solar Hot Water", "Safe Parking"],
        farmActivities: {
            complimentary: ["Dawn Kangeyam Cow Milking", "Farm Walk & Veggie Plucking", "Agricultural Well Swimming (Kinaru)", "Sunset Bullock Cart Village Ride"],
            addOns: [
                { id: "pottery", title: "Traditional Clay Pottery Workshop", price: 250, coinCost: 25, duration: "1.5 Hrs", desc: "Handcraft your own terracotta pot with village potter Kumaran." },
                { id: "cooking", title: "Woodfire Mud-Pot Kongu Cooking Masterclass", price: 400, coinCost: 40, duration: "2 Hrs", desc: "Cook authentic mutton/country chicken or mushroom curry on firewood chulha." },
                { id: "jaggery", title: "Sugarcane Jaggery (Vellam) Crushing Demo", price: 300, coinCost: 30, duration: "1.5 Hrs", desc: "See raw cane crushed and boiled in giant copper vats into pure organic jaggery." }
            ]
        },
        farmMenu: {
            breakfast: "Fresh Tender Coconut, Steaming Idlis, Samai Pongal & 3 Coconut Chutneys with Filter Coffee",
            lunch: "Unlimited Banana Leaf Mud-Pot Thali, Country Chicken / Raw Banana Curry, Heirloom Ponni Rice & Fresh Curd",
            snacks: "Roasted Sweet Corn, Boiled Groundnuts & Herbal Karupatti Tea",
            dinner: "Crispy Ragi & Kuthiraivali Dosas, Spiced Horsegram Rasam & Jaggery Halwa"
        },
        dailyRoutine: [
            { time: "06:30 AM", title: "Dawn Temple Chimes & Cow Milking", desc: "Herbal decoction on the Thinnai porch and milking gentle Kangeyam cows." },
            { time: "08:30 AM", title: "Farmhouse Banana Leaf Breakfast", desc: "Hot breakfast prepared with ingredients harvested that very morning." },
            { time: "10:30 AM", title: "Hands-on Farming & Well Swim", desc: "Tractor ride, vegetable plucking, and swimming in the freshwater well." },
            { time: "01:30 PM", title: "Traditional Earthen Pot Feast", desc: "Woodfire feast served with farm-pressed virgin oils and unpolished grains." },
            { time: "05:30 PM", title: "Sunset Bullock Cart Village Trail", desc: "Scenic ride across countryside mud tracks during golden hour." },
            { time: "08:00 PM", title: "Campfire, Folk Stories & Stargazing", desc: "Traditional folklore, roasted sweet corn, and stargazing." }
        ],
        reviews: [
            { user: "Karthik Raghavan", rating: 5, date: "3 days ago", comment: "Staying with Raman's family was the best vacation our kids ever had. The well swimming and food were unbeatable!" },
            { user: "Pooja Sundaram", rating: 5, date: "1 week ago", comment: "Pure tranquility. Working on the farm in the morning and eating fresh banana leaf meals was soul-soothing." }
        ]
    },
    {
        id: "fs_thanjavur",
        name: "Marudham Delta Heritage Paddy Farmstead",
        district: "Thanjavur",
        region: "Cauvery Delta (Rice Bowl of TN)",
        price: 2200,
        coinCost: 220,
        rating: 4.9,
        reviewsCount: 96,
        image: villageLifeHeroImg,
        gallery: [villageLifeHeroImg, villageHomeImg, natureBgImg],
        desc: "A 120-year-old restored traditional heritage home surrounded by emerald green paddy fields. Experience organic heirloom rice farming (Karuppu Kavuni, Mappillai Samba) and Cauvery river canal walks.",
        farmer: {
            name: "Senthil Nathan & Family",
            experience: "Heirloom Seed Conservator (25 yrs)",
            avatar: villageActivityImg,
            languages: ["Tamil", "English"],
            bio: "We conserve 18 native varieties of Tamil paddy. We welcome guests to experience how food was grown 500 years ago in the Chola kingdom heartland."
        },
        rooms: [
            { id: "r1", name: "Chola Courtyard Royal Suite", type: "Heritage Suite", price: 2600, coinCost: 260, capacity: "2-4 Guests", bed: "Teak King Bed", ac: true, desc: "Restored ancestral suite with Athangudi handmade tiles, carved wooden doors, and open sky courtyard.", img: villageHomeImg },
            { id: "r2", name: "Paddy View Thinnai Room", type: "Heritage Room", price: 2000, coinCost: 200, capacity: "2 Guests", bed: "Queen Bed", ac: false, desc: "Charming traditional room overlooking expansive green paddy fields with breeze catchers.", img: villageLifeHeroImg }
        ],
        amenities: ["3 Meals Included", "Wi-Fi", "AC Available", "Pet Friendly", "Solar Powered", "Safe Parking"],
        farmActivities: {
            complimentary: ["Paddy Sowing & Weeding Walk", "Canal Water Dip", "Heirloom Seed Preservation Tour", "Evening Temple Granary Walk"],
            addOns: [
                { id: "kolam", title: "Sacred Kolam & Rice Flour Art Workshop", price: 200, coinCost: 20, duration: "1 Hr", desc: "Learn traditional symmetrical sacred floor geometry from grandmother Meenakshi." },
                { id: "cooking", title: "Delta Heirloom Rice & Kuzhambu Feast Class", price: 350, coinCost: 35, duration: "2 Hrs", desc: "Master cooking with black rice (Karuppu Kavuni) and clay pot vatha kuzhambu." }
            ]
        },
        farmMenu: {
            breakfast: "Mappillai Samba Idlis with Drumstick Sambar & 3 Fresh Chutneys",
            lunch: "Full Delta Banana Leaf Meal with 5 vegetable kootus, Vatha Kuzhambu, Rasam & Curd in clay pots",
            snacks: "Kozhukattai, Sundal & Fresh Buttermilk (Neer Moru)",
            dinner: "Thinai (Foxtail Millet) Pongal with spicy Kathirikai Gothsu & Karuppu Kavuni Sweet Payasam"
        },
        dailyRoutine: [
            { time: "06:00 AM", title: "Morning Temple Chimes & Kolam Drawing", desc: "Start the day drawing auspicious geometric rice patterns with family elders." },
            { time: "08:00 AM", title: "Farmhouse Breakfast with Heirloom Millets", desc: "Nutritious breakfast prepared from native grain harvests." },
            { time: "10:00 AM", title: "Paddy Field Walk & Canal Dip", desc: "Walk through muddy bunds, learn organic pest management, and bathe in canal waters." },
            { time: "01:30 PM", title: "Grand Delta Banana Leaf Lunch", desc: "Traditional 7-course Chola style meal served on banana leaves." },
            { time: "05:00 PM", title: "Village Temple & Granary Heritage Walk", desc: "Discover historic community water harvesting tanks and ancient temple grain banks." },
            { time: "08:00 PM", title: "Folk Songs & Starlight Dinner", desc: "Storytelling, devotional chanting, and starlight dinner." }
        ],
        reviews: [
            { user: "Dr. V. Sundaresan", rating: 5, date: "5 days ago", comment: "Staying here felt like visiting my ancestral village home. Senthil's passion for native paddy is inspiring." },
            { user: "Lavanya Mohan", rating: 5, date: "2 weeks ago", comment: "The food was pure medicine for the soul. The courtyard room is majestic and serene." }
        ]
    },
    {
        id: "fs_salem",
        name: "Laxmi Farm Meadows & Mango Orchards",
        district: "Salem",
        region: "Yercaud Foothills & Mango Belt",
        price: 1800,
        coinCost: 180,
        rating: 4.8,
        reviewsCount: 84,
        image: villageHomeImg,
        gallery: [villageHomeImg, natureBgImg, villageActivityImg],
        desc: "A scenic 20-acre organic farm nested at the foothills of Yercaud. Featuring century-old mango trees, native A2 cows, an artisan pottery studio, and cool mountain breezes.",
        farmer: {
            name: "Lakshmi Amma & Sons",
            experience: "Organic Horticulturalist (30 yrs)",
            avatar: villageActivityImg,
            languages: ["Tamil", "English", "Kannada"],
            bio: "Our mango orchards have been chemical-free since 1995. We produce 6 varieties of Salem mangoes, organic turmeric, and fresh cow milk."
        },
        rooms: [
            { id: "r1", name: "Mango Grove Heritage Villa", type: "Villa", price: 2400, coinCost: 240, capacity: "2-4 Guests", bed: "King Bed", ac: true, desc: "Spacious country villa nestled directly inside mango and guava trees with private sit-out.", img: villageHomeImg },
            { id: "r2", name: "Foothill Orchard Safari Tent", type: "Glamping Tent", price: 1600, coinCost: 160, capacity: "2 Guests", bed: "Queen Bed", ac: false, desc: "Weather-proof bell tent under fruit trees with private firepit and mountain views.", img: natureBgImg }
        ],
        amenities: ["3 Meals Included", "Wi-Fi", "Pet Friendly", "Safe Parking", "Mud Pottery Studio", "Campfire Pit"],
        farmActivities: {
            complimentary: ["Mango & Guava Fruit Plucking", "Cow Milking & Organic Composting", "Foothill Nature Walk", "Night Campfire"],
            addOns: [
                { id: "pottery", title: "Master Pottery Wheel Session", price: 250, coinCost: 25, duration: "1.5 Hrs", desc: "Learn to shape clay from our on-site master potter." },
                { id: "mango_pickle", title: "Traditional Mango Pickle Workshop", price: 300, coinCost: 30, duration: "1.5 Hrs", desc: "Create your own jar of sun-dried Salem mango pickle to take home." }
            ]
        },
        farmMenu: {
            breakfast: "Ragi Koozh with shallots & raw mango pickle, Hot Paniyaram with spicy chutney & Fresh Milk",
            lunch: "Salem Style Mango Kootu, Woodfire Country Chicken / Paneer, Organic Ponni Rice & Sweet Mango Pachadi",
            snacks: "Fresh Fruit Salad, Sundal & Chai",
            dinner: "Steaming Kothu Parotta (Veg / Non-Veg) or Millet Dosas with Pepper Rasam"
        },
        dailyRoutine: [
            { time: "06:30 AM", title: "Dawn Birdwatching & Milking", desc: "Listen to peacocks calling across the Yercaud foothills." },
            { time: "08:30 AM", title: "Traditional Breakfast on Verandah", desc: "Ragi koozh and paniyaram overlooking fruit orchards." },
            { time: "10:30 AM", title: "Fruit Plucking & Composting Tour", desc: "Pick fresh seasonal fruits and learn vermicompost preparation." },
            { time: "01:30 PM", title: "Farmhouse Lunch with Fresh Spices", desc: "Authentic spicy Kongu-Salem style lunch." },
            { time: "04:30 PM", title: "Pottery Workshop & High Tea", desc: "Try your hands on the potter's wheel while enjoying hot snacks." },
            { time: "08:00 PM", title: "Orchard Campfire & Barbecue", desc: "Campfire under starry mountain skies." }
        ],
        reviews: [
            { user: "Rajesh Kannan", rating: 5, date: "1 week ago", comment: "The mango picking and pottery classes were memorable for my family. Lakshmi Amma treats everyone like relatives." },
            { user: "Deepak V.", rating: 4.8, date: "3 weeks ago", comment: "Great glamping tent, very cool weather at night, and incredible homemade food." }
        ]
    },
    {
        id: "fs_nilgiris",
        name: "Kurumba Highlands Tea & Spice Farmstay",
        district: "Nilgiris",
        region: "Nilgiri Mountain Range (Coonoor / Ooty)",
        price: 3200,
        coinCost: 320,
        rating: 4.9,
        reviewsCount: 142,
        image: nilgirisTeaImg,
        gallery: [nilgirisTeaImg, valparaiCoffeeImg, natureBgImg],
        desc: "A vintage British-era colonial planter's estate surrounded by organic high-altitude tea gardens, cardamom plants, and eucalyptus woods at 6,000 feet elevation.",
        farmer: {
            name: "Arun & Deepa Kuruvilla",
            experience: "Specialty Tea Maker & Botanist (20 yrs)",
            avatar: valparaiCoffeeImg,
            languages: ["Tamil", "English", "Malayalam", "Hindi"],
            bio: "We grow handpicked organic white, green, and orthodox black teas with natural biodiversity buffers for birds and wild pollinators."
        },
        rooms: [
            { id: "r1", name: "Colonial Planter's Fireplace Suite", type: "Colonial Suite", price: 3500, coinCost: 350, capacity: "2-3 Guests", bed: "King Bed", ac: false, desc: "Vintage wooden bungalow suite with real working stone fireplace, bay windows, and tea garden views.", img: nilgirisTeaImg },
            { id: "r2", name: "Misty Valley Wooden Cottage", type: "Wooden Chalet", price: 2800, coinCost: 280, capacity: "2 Guests", bed: "Queen Bed", ac: false, desc: "Cozy pine-wood cottage perched over the tea valley with private balcony.", img: valparaiCoffeeImg }
        ],
        amenities: ["3 Meals Included", "Working Fireplace", "Wi-Fi", "Mountain Trekking", "Pet Friendly", "Tea Tasting Lab", "Safe Parking"],
        farmActivities: {
            complimentary: ["Morning Tea Plucking with Baskets", "Artisanal Tea Tasting & Brewing Session", "Spice Trail (Cardamom & Cloves)", "Evening Fireplace Bonfire"],
            addOns: [
                { id: "honey_forage", title: "Wild Nilgiris Forest Honey Tasting", price: 300, coinCost: 30, duration: "1 Hr", desc: "Taste 4 varieties of raw, unpasteurized tribal forest honey." },
                { id: "baking", title: "High-Altitude Scones & Berry Jam Baking", price: 400, coinCost: 40, duration: "1.5 Hrs", desc: "Bake fresh English scones and fresh strawberry jam with Deepa." }
            ]
        },
        farmMenu: {
            breakfast: "Fresh Farm Eggs / Fluffy Appam with Coconut Milk, Homemade Strawberry Preserves & Specialty Nilgiris Tea",
            lunch: "Anglo-Indian Country Stew or Nilgiris Green Herb Curry with Rice & Warm Bread",
            snacks: "Freshly Baked Warm Scones, Tea Cakes & First-Flush White Tea",
            dinner: "Warm Pepper Chicken or Vegetable Au Gratin, Steaming Soups & Apple Crumble by the Fireplace"
        },
        dailyRoutine: [
            { time: "06:30 AM", title: "Misty Sunrise & Basket Tea Plucking", desc: "Head out with wicker baskets to pluck 'two leaves and a bud'." },
            { time: "08:30 AM", title: "English Countryside Breakfast", desc: "Fresh fruit preserves, hot bakes, and freshly brewed tea." },
            { time: "11:00 AM", title: "Tea Factory & Cupping Session", desc: "Learn withering, rolling, oxidation, and tea tasting techniques." },
            { time: "01:30 PM", title: "Hill Station Lunch", desc: "Warm comforting meal served in the colonial dining hall." },
            { time: "04:30 PM", title: "Spice Walk & High Tea", desc: "Walk through cardamom, cinnamon, and pepper trees." },
            { time: "08:00 PM", title: "Fireplace Gathering & Dinner", desc: "Warm up by the roaring stone fireplace with stories." }
        ],
        reviews: [
            { user: "Meera Subramanian", rating: 5, date: "4 days ago", comment: "The fireplace, the cool misty weather, and Arun's tea tasting made this an unforgettable stay." },
            { user: "Nitin Kamath", rating: 5, date: "2 weeks ago", comment: "Outstanding hospitality. The rooms are spotless and the tea plucking experience was top notch." }
        ]
    },
    {
        id: "fs_madurai",
        name: "Malli Solai Jasmine & Country Farmstead",
        district: "Madurai",
        region: "Vaigai Valley (Madurai & Theni)",
        price: 2000,
        coinCost: 200,
        rating: 4.8,
        reviewsCount: 78,
        image: kodaikanalOrganicImg,
        gallery: [kodaikanalOrganicImg, villageActivityImg, villageHomeImg],
        desc: "A fragrant 10-acre jasmine (Madurai Malli) and banana farm nestled along the Vaigai canal. Experience dawn flower harvesting, rural bullock cart expeditions, and famous bold Madurai culinary traditions.",
        farmer: {
            name: "Pandian & Selvi",
            experience: "Jasmine & Banana Farmer (22 yrs)",
            avatar: villageActivityImg,
            languages: ["Tamil", "English"],
            bio: "Our family supplies pure Madurai Malli for temple rituals and natural perfumes. We love sharing the fragrance and generosity of rural Madurai."
        },
        rooms: [
            { id: "r1", name: "Jasmine Fragrance Courtyard Cottage", type: "Cottage", price: 2300, coinCost: 230, capacity: "2-3 Guests", bed: "Queen Bed", ac: true, desc: "Charming cottage surrounded by blooming jasmine shrubs with traditional courtyard.", img: kodaikanalOrganicImg },
            { id: "r2", name: "Rustic Banana Grove Chalet", type: "Chalet", price: 1800, coinCost: 180, capacity: "2 Guests", bed: "Queen Bed", ac: false, desc: "Naturally cooled cottage shaded by broad banana fronds.", img: villageHomeImg }
        ],
        amenities: ["3 Meals Included", "Wi-Fi", "AC Available", "Pet Friendly", "Safe Parking"],
        farmActivities: {
            complimentary: ["05:30 AM Jasmine Flower Picking at Dawn", "Garland Weaving Class", "Vaigai Canal Bathing", "Village Bullock Cart Ride"],
            addOns: [
                { id: "madurai_food", title: "Madurai Spice Grinding & Kari Dosai Class", price: 350, coinCost: 35, duration: "2 Hrs", desc: "Learn to grind fresh aromatic Madurai masalas on traditional stone ammi kal." }
            ]
        },
        farmMenu: {
            breakfast: "Soft Madurai Malli Idlis with 4 spicy chutneys, Vadai & piping hot Jigarthanda dessert",
            lunch: "Authentic Spicy Madurai Chukka / Mushroom Gravy with Biryani & Seeraga Samba Rice",
            snacks: "Hot Vazhaipoo (Banana Blossom) Vadai & Filter Coffee",
            dinner: "Fluffy Bun Parotta with spicy Salna & Fresh Country Milk"
        },
        dailyRoutine: [
            { time: "05:30 AM", title: "Dawn Jasmine Flower Plucking", desc: "Experience the incredible scent of jasmine buds opening before sunrise." },
            { time: "08:30 AM", title: "World-famous Madurai Idli Breakfast", desc: "Mouth-watering soft idlis with rich chutneys and sambar." },
            { time: "10:30 AM", title: "Flower Market & Canal Walk", desc: "See how flowers are woven into garlands and exported." },
            { time: "01:30 PM", title: "Bold & Spicy Madurai Lunch", desc: "Legendary bold spices cooked on woodfire stoves." },
            { time: "05:30 PM", title: "Sunset Bullock Cart Ride", desc: "Golden hour ride along village irrigation bunds." },
            { time: "08:30 PM", title: "Bun Parotta & Jigarthanda Feast", desc: "Classic Madurai culinary feast." }
        ],
        reviews: [
            { user: "Gautam R.", rating: 5, date: "1 week ago", comment: "The 5:30 AM jasmine plucking was magical! The food was out of this world." }
        ]
    },
    {
        id: "fs_tenkasi",
        name: "Courtallam Palmyra Palms & River Sanctuary",
        district: "Tenkasi",
        region: "Western Ghats Border (Tenkasi & Tirunelveli)",
        price: 1900,
        coinCost: 190,
        rating: 4.9,
        reviewsCount: 88,
        image: natureBgImg,
        gallery: [natureBgImg, villageHomeImg, villageActivityImg],
        desc: "A tranquil farm sanctuary located near natural herbal mineral waterfalls. Surrounded by towering palmyra palms (Panai Maram), coconut groves, and organic red banana plantations.",
        farmer: {
            name: "Shanmugam & Valli",
            experience: "Palmyra & Heritage Crop Farmer (28 yrs)",
            avatar: villageActivityImg,
            languages: ["Tamil", "English", "Malayalam"],
            bio: "We preserve Tamil Nadu's state tree—the Palmyra palm. We harvest natural sweet Pathaneer (palm nectar), palm jaggery, and red banana varieties."
        },
        rooms: [
            { id: "r1", name: "Palmyra Thatched Eco Cottage", type: "Eco Cottage", price: 2100, coinCost: 210, capacity: "2-3 Guests", bed: "Queen Bed", ac: false, desc: "Traditional woven palmyra thatched roof cottage with natural cooling and river breeze.", img: natureBgImg },
            { id: "r2", name: "Ghats View Heritage Room", type: "Heritage Room", price: 1800, coinCost: 180, capacity: "2 Guests", bed: "Queen Bed", ac: true, desc: "Stone masonry room with views of mist-clad Western Ghats mountains.", img: villageHomeImg }
        ],
        amenities: ["3 Meals Included", "Natural Stream Bath", "Wi-Fi", "Pet Friendly", "Solar Powered", "Safe Parking"],
        farmActivities: {
            complimentary: ["Morning Fresh Pathaneer (Palm Nectar) Tasting", "Natural Mountain Stream Bath", "Palmyra Leaf Craft Workshop", "Sunset Waterfall Walk"],
            addOns: [
                { id: "halwa_demo", title: "Tirunelveli Wheat Halwa Masterclass", price: 300, coinCost: 30, duration: "1.5 Hrs", desc: "Learn the secrets of making pure ghee wheat halwa using river Thamirabarani water." }
            ]
        },
        farmMenu: {
            breakfast: "Fresh Sweet Pathaneer, Kambu Dosai with spicy Poondu (Garlic) Chutney & Palm Jaggery Coffee",
            lunch: "Tirunelveli Sodhi Kuzhambu (Coconut milk stew) with Seeraga Samba Rice, Potato Roast & Appalam",
            snacks: "Panai Kizhangu (Palm tuber), Sweet Pidi Kozhukattai & Tea",
            dinner: "Puttu with Kadala Curry & Warm Tirunelveli Halwa"
        },
        dailyRoutine: [
            { time: "06:00 AM", title: "Tasting Fresh Morning Palm Nectar", desc: "Drink sweet unfermented Pathaneer collected fresh at dawn from palmyra trees." },
            { time: "08:30 AM", title: "Farmhouse Healthy Millet Breakfast", desc: "Kambu dosas and spicy village chutneys." },
            { time: "10:30 AM", title: "Natural Mountain Stream & Waterfall Bath", desc: "Bathe in natural mineral-rich mountain water streams flowing through the farm." },
            { time: "01:30 PM", title: "Tirunelveli Sodhi Feast on Banana Leaf", desc: "Delicate coconut milk stew feast." },
            { time: "04:30 PM", title: "Palmyra Weaving & Halwa Making", desc: "Learn to weave palm leaf boxes and taste fresh halwa." },
            { time: "08:00 PM", title: "Ghats Breeze Campfire & Dinner", desc: "Relaxing dinner under the breezy night sky." }
        ],
        reviews: [
            { user: "Dr. S. Balaji", rating: 5, date: "1 week ago", comment: "Drinking fresh Pathaneer at dawn and swimming in the stream was pure bliss. Shanmugam is a gem of a person." }
        ]
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

    // --- Stay with Farmers Hotel & Lifestyle States ---
    const [selectedDistrict, setSelectedDistrict] = useState('All');
    const [selectedAmenity, setSelectedAmenity] = useState('All');
    const [selectedStayDetails, setSelectedStayDetails] = useState(null);
    const [stayDetailsTab, setStayDetailsTab] = useState('rooms'); // 'rooms' | 'routine' | 'menu' | 'host' | 'reviews'
    const [activeStayBooking, setActiveStayBooking] = useState(null);
    const [confirmedVoucher, setConfirmedVoucher] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', favoriteActivity: '', userName: '' });
    const [userReviewsMap, setUserReviewsMap] = useState({});
    const [submittingReview, setSubmittingReview] = useState(false);

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

    // Handle Search & Filtering for Stays and Villages
    const handleSearch = () => {
        if (!searchTerm.trim()) {
            setLocalStays([]);
            setPlaces([]);
            return;
        }
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
                stay.district.toLowerCase().includes(searchTerm.toLowerCase()) || 
                stay.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stay.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stay.desc.toLowerCase().includes(searchTerm.toLowerCase())
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
                    setError('No results found. Try broader terms or select a district above.');
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
        setSelectedDistrict('All');
        setSelectedAmenity('All');
        setActiveSubTab('explore');
    };

    // Open Deep Dive Details Modal
    const handleOpenStayDetails = (stay, initialTab = 'rooms') => {
        setSelectedStayDetails(stay);
        setStayDetailsTab(initialTab);
    };

    // Open Hotel & Lifestyle Booking Engine Modal
    const handleOpenStayBooking = (stay, room = null) => {
        const selectedRoom = room || stay.rooms[0];
        setActiveStayBooking({
            stay,
            room: selectedRoom,
            checkIn: getTomorrowDate(),
            checkOut: getDayAfterTomorrowDate(),
            adults: 2,
            children: 0,
            mealPlan: 'full_board',
            selectedAddOns: [],
            volunteerDiscount: false,
            paymentMethod: 'cash'
        });
    };

    // Confirm Hotel & Lifestyle Farmstay Booking
    const handleConfirmStayBooking = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Please login to make bookings.");
            navigate('/login');
            return;
        }

        if (!activeStayBooking) return;

        const { stay, room, checkIn, checkOut, adults, children, mealPlan, selectedAddOns, volunteerDiscount, paymentMethod } = activeStayBooking;

        const d1 = new Date(checkIn);
        const d2 = new Date(checkOut);
        const timeDiff = d2.getTime() - d1.getTime();
        const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

        const roomTotal = (room?.price || stay.price) * nights;
        const mealDiscount = mealPlan === 'breakfast' ? 300 * adults * nights : 0;

        let addOnsCost = 0;
        const addOnDetails = [];
        if (selectedAddOns && selectedAddOns.length > 0) {
            selectedAddOns.forEach(addOnId => {
                const found = stay.farmActivities?.addOns?.find(a => a.id === addOnId);
                if (found) {
                    addOnsCost += found.price * (Number(adults) + Number(children));
                    addOnDetails.push({ id: found.id, title: found.title, price: found.price });
                }
            });
        }

        const subtotal = Math.max(0, roomTotal - mealDiscount) + addOnsCost;
        const volunteerDiscountAmount = volunteerDiscount ? Math.round(subtotal * 0.15) : 0;
        const finalCashAmount = Math.max(0, subtotal - volunteerDiscountAmount);
        const finalCoinAmount = Math.ceil(finalCashAmount / 10);

        if (paymentMethod === 'coins' && walletSummary.ecopoints < finalCoinAmount) {
            alert(`Insufficient Eco Coins! You need ${finalCoinAmount} coins but only have ${walletSummary.ecopoints}.`);
            return;
        }

        try {
            const passCode = `TN-FARM-${Math.floor(100000 + Math.random() * 900000)}`;
            const bookingDoc = {
                stayId: stay.id,
                experienceTitle: stay.name,
                hostName: stay.farmer.name,
                district: stay.district,
                region: stay.region,
                roomName: room?.name || 'Heritage Suite',
                checkInDate: checkIn,
                checkOutDate: checkOut,
                nights: nights,
                numberOfGuests: Number(adults) + Number(children),
                adults: Number(adults),
                children: Number(children),
                mealPlan: mealPlan === 'full_board' ? 'Full Board (All 3 Meals Included)' : 'Bed & Breakfast Only',
                addOns: addOnDetails,
                volunteerDiscountApplied: Boolean(volunteerDiscount),
                totalAmount: paymentMethod === 'coins' ? finalCoinAmount : finalCashAmount,
                paymentMethod: paymentMethod,
                passCode: passCode,
                category: 'Stay with Farmers',
                status: 'confirmed',
                bookedAt: serverTimestamp()
            };

            await addDoc(collection(db, 'users', currentUser.uid, 'bookings'), bookingDoc);

            if (paymentMethod === 'coins') {
                const walletRef = doc(db, 'users', currentUser.uid, 'wallet', 'summary');
                await updateDoc(walletRef, {
                    ecopoints: increment(-finalCoinAmount),
                    points: increment(-finalCoinAmount)
                });

                await addDoc(collection(db, 'users', currentUser.uid, 'wallet', 'transactions'), {
                    amount: finalCoinAmount,
                    type: 'debit',
                    description: `Stay with Farmer: ${stay.name} (${nights} Nights)`,
                    category: 'redemption',
                    timestamp: serverTimestamp()
                });
            }

            // Show confirmed digital farm pass voucher
            setConfirmedVoucher({
                ...bookingDoc,
                stayName: stay.name,
                farmerName: stay.farmer.name,
                farmerPhone: "+91 94432 18920",
                image: stay.image,
                finalAmount: paymentMethod === 'coins' ? `${finalCoinAmount} Coins` : `₹${finalCashAmount}`
            });

            setActiveStayBooking(null);
            if (selectedStayDetails) setSelectedStayDetails(null);
        } catch (err) {
            console.error("Stay Booking error:", err);
            alert("Failed to complete farm booking. Please try again.");
        }
    };

    // Submit Review & Earn +50 Eco Coins
    const handleSubmitReview = async (stayId, e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Please login to submit a review and earn +50 Eco Coins!");
            navigate('/login');
            return;
        }

        if (!reviewForm.comment.trim()) {
            alert("Please enter your review comments.");
            return;
        }

        setSubmittingReview(true);
        try {
            const newRev = {
                user: reviewForm.userName.trim() || currentUser.displayName || currentUser.email.split('@')[0] || "Verified Traveler",
                rating: Number(reviewForm.rating) || 5,
                date: "Just now",
                comment: reviewForm.comment,
                favoriteActivity: reviewForm.favoriteActivity
            };

            setUserReviewsMap(prev => ({
                ...prev,
                [stayId]: [newRev, ...(prev[stayId] || [])]
            }));

            // Award 50 Eco Coins
            const walletRef = doc(db, 'users', currentUser.uid, 'wallet', 'summary');
            await updateDoc(walletRef, {
                ecopoints: increment(50),
                points: increment(50)
            });

            await addDoc(collection(db, 'users', currentUser.uid, 'wallet', 'transactions'), {
                amount: 50,
                type: 'credit',
                description: `⭐ Farm Review Reward: ${selectedStayDetails?.name || 'Farmstay'}`,
                category: 'reward',
                timestamp: serverTimestamp()
            });

            alert("🎉 Thank you! Your review has been submitted and +50 Eco Coins have been added to your wallet! 🪙");
            setReviewForm({ rating: 5, comment: '', favoriteActivity: '', userName: '' });
        } catch (err) {
            console.error("Review submission error:", err);
            alert("Failed to submit review. Please try again.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleConfirmBooking = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
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
                                    <h2>Stay with Farmers — Rural Resorts</h2>
                                </div>
                                <div className="stay-hero">
                                    <img src={villageHomeImg} alt="Authentic Tamil Heritage Farmstay" />
                                </div>
                                <div className="stay-features" style={{ margin: '14px 0 10px 0', flexWrap: 'wrap', gap: '8px' }}>
                                    <span className="feature-pill">🍲 3 Farm Meals Included</span>
                                    <span className="feature-pill">🏊 Well Swimming (Kinaru)</span>
                                    <span className="feature-pill">🐄 A2 Cow Milking</span>
                                    <span className="feature-pill">🌱 15% Volunteer Discount</span>
                                </div>
                                <div style={{ padding: '0 20px', fontSize: '0.82rem', color: '#555', marginBottom: '10px' }}>
                                    <strong>📍 Available in:</strong> Pollachi, Thanjavur, Salem, Nilgiris, Madurai & Tenkasi
                                </div>
                                <div className="stay-pricing">
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#810000' }}>From ₹1800 / Night</span>
                                    <button className="btn-green" onClick={() => handleSelect('stay')}>Check Availability</button>
                                    <button className="btn-wood" onClick={() => handleSelect('stay')}>Explore Stays</button>
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

                                {/* HOTEL & LIFESTYLE STAY WITH FARMERS VIEW */}
                                {activeSection === 'stay' && (
                                    <div className="dashboard-panel" style={{ padding: '30px', minHeight: '600px' }}>
                                        <div className="panel-header" style={{ marginBottom: '25px', borderRadius: '12px' }}>
                                            <h2>Stay with Farmers — Rural Resorts & Homestays</h2>
                                        </div>

                                        {/* District & Region Filter Bar */}
                                        <div className="district-filter-container">
                                            <div className="district-filter-label">
                                                <i className="fa-solid fa-map-location-dot"></i> Select Tamil Nadu Agricultural Hub
                                            </div>
                                            <div className="district-filter-pills">
                                                {[
                                                    { id: 'All', label: 'All Districts', icon: '🌾' },
                                                    { id: 'Pollachi', label: 'Pollachi (Kongu Belt)', icon: '🥥' },
                                                    { id: 'Thanjavur', label: 'Thanjavur (Cauvery Delta)', icon: '🌾' },
                                                    { id: 'Salem', label: 'Salem & Krishnagiri', icon: '🥭' },
                                                    { id: 'Nilgiris', label: 'Nilgiris (Coonoor/Ooty)', icon: '☕' },
                                                    { id: 'Madurai', label: 'Madurai & Theni', icon: '🌸' },
                                                    { id: 'Tenkasi', label: 'Tenkasi & Tirunelveli', icon: '🌴' }
                                                ].map(dist => (
                                                    <button
                                                        key={dist.id}
                                                        className={`district-pill ${selectedDistrict === dist.id ? 'active' : ''}`}
                                                        onClick={() => {
                                                            setSelectedDistrict(dist.id);
                                                            setSearchTerm('');
                                                            setPlaces([]);
                                                        }}
                                                    >
                                                        <span>{dist.icon}</span>
                                                        <span>{dist.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Lifestyle & Amenity Filters */}
                                            <div className="amenity-filter-pills">
                                                <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#666', marginRight: '6px', display: 'inline-flex', alignItems: 'center' }}>Filters:</span>
                                                {['All', 'Well Swimming', '3 Meals Included', 'Pet Friendly', 'AC Available', 'Wi-Fi'].map(amenity => (
                                                    <button
                                                        key={amenity}
                                                        className={`amenity-pill ${selectedAmenity === amenity ? 'active' : ''}`}
                                                        onClick={() => setSelectedAmenity(amenity)}
                                                    >
                                                        {amenity === 'All' ? '✨ All Stays' : amenity}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Search Input Bar */}
                                        <div className="search-container" style={{ marginBottom: '25px' }}>
                                            <div className="search-input-wrapper">
                                                <i className="fa-solid fa-search search-icon"></i>
                                                <input
                                                    type="text"
                                                    className="search-input"
                                                    placeholder='Search by farm name, district, or crop (e.g. "Mango", "Pollachi", "Tea")...'
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

                                        {/* Filtered Curated Hotel-Grade Farmstays */}
                                        {(() => {
                                            const filteredStays = curatedFarmStays.filter(stay => {
                                                const matchDistrict = selectedDistrict === 'All' || stay.district === selectedDistrict;
                                                const matchAmenity = selectedAmenity === 'All' || stay.amenities.includes(selectedAmenity);
                                                const matchSearch = !searchTerm.trim() || 
                                                    stay.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    stay.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    stay.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    stay.desc.toLowerCase().includes(searchTerm.toLowerCase());
                                                return matchDistrict && matchAmenity && matchSearch;
                                            });

                                            return (
                                                <div style={{ marginBottom: '30px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                        <h3 style={{ margin: 0, color: '#810000', fontFamily: 'Merriweather', fontSize: '1.25rem' }}>
                                                            🌿 {selectedDistrict === 'All' ? 'Curated Farmer Homestays in Tamil Nadu' : `Verified Farm Stays in ${selectedDistrict}`} ({filteredStays.length})
                                                        </h3>
                                                        {(selectedDistrict !== 'All' || selectedAmenity !== 'All' || searchTerm) && (
                                                            <button 
                                                                className="btn-wood" 
                                                                style={{ padding: '4px 12px', fontSize: '0.75rem' }} 
                                                                onClick={() => { setSelectedDistrict('All'); setSelectedAmenity('All'); setSearchTerm(''); }}
                                                            >
                                                                Reset Filters
                                                            </button>
                                                        )}
                                                    </div>

                                                    {filteredStays.length === 0 ? (
                                                        <div style={{ textAlign: 'center', padding: '40px', background: '#fdfbf7', borderRadius: '16px', border: '1px dashed #d4af37' }}>
                                                            <p style={{ margin: 0, color: '#666', fontSize: '1rem' }}>No farmstays found matching your filter criteria.</p>
                                                            <button 
                                                                className="btn-green" 
                                                                style={{ marginTop: '12px', padding: '8px 18px', fontSize: '0.85rem' }}
                                                                onClick={() => { setSelectedDistrict('All'); setSelectedAmenity('All'); setSearchTerm(''); }}
                                                            >
                                                                View All Stays
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="farmstay-hotel-grid">
                                                            {filteredStays.map(stay => (
                                                                <div key={stay.id} className="farmstay-card-hotel">
                                                                    {/* Image & Badges */}
                                                                    <div className="farmstay-img-wrap" onClick={() => handleOpenStayDetails(stay)}>
                                                                        <img src={stay.image} className="farmstay-img" alt={stay.name} />
                                                                        <div className="farmstay-top-badges">
                                                                            <span className="district-badge-chip">📍 {stay.district}</span>
                                                                            <span className="rating-badge-chip">★ {stay.rating} ({stay.reviewsCount + (userReviewsMap[stay.id]?.length || 0)})</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Farmer Host Bar */}
                                                                    <div className="farmer-host-bar">
                                                                        <img src={stay.farmer.avatar} className="farmer-host-avatar" alt={stay.farmer.name} />
                                                                        <div className="farmer-host-info">
                                                                            <p className="farmer-host-name">Hosted by {stay.farmer.name}</p>
                                                                            <p className="farmer-host-tag">{stay.farmer.experience}</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Card Content */}
                                                                    <div className="farmstay-card-body">
                                                                        <h4 className="farmstay-card-title" onClick={() => handleOpenStayDetails(stay)} style={{ cursor: 'pointer' }}>{stay.name}</h4>
                                                                        <div className="farmstay-card-region">
                                                                            <i className="fa-solid fa-seedling"></i> {stay.region}
                                                                        </div>

                                                                        <div className="farmstay-meal-highlight">
                                                                            <i className="fa-solid fa-utensils"></i> 3 Farm-to-Table Meals Included
                                                                        </div>

                                                                        <div className="farmstay-amenities-tags">
                                                                            {stay.amenities.slice(0, 4).map(amenity => (
                                                                                <span key={amenity} className="farmstay-tag-pill">{amenity}</span>
                                                                            ))}
                                                                            {stay.amenities.length > 4 && (
                                                                                <span className="farmstay-tag-pill">+{stay.amenities.length - 4} more</span>
                                                                            )}
                                                                        </div>

                                                                        <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '12px' }}>
                                                                            <strong>🛏️ {stay.rooms.length} Room Options:</strong> {stay.rooms.map(r => r.name).join(', ')}
                                                                        </div>

                                                                        {/* Price and Actions */}
                                                                        <div className="farmstay-card-footer">
                                                                            <div className="farmstay-price-block">
                                                                                <span className="farmstay-price-val">₹{stay.price} <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>/ night</span></span>
                                                                                <span className="farmstay-coin-val">or {stay.coinCost} Eco Coins</span>
                                                                            </div>
                                                                            <div className="farmstay-btn-group">
                                                                                <button 
                                                                                    className="btn-details-outline" 
                                                                                    onClick={() => handleOpenStayDetails(stay)}
                                                                                >
                                                                                    Explore
                                                                                </button>
                                                                                <button 
                                                                                    className="btn-book-primary"
                                                                                    onClick={() => handleOpenStayBooking(stay)}
                                                                                >
                                                                                    Reserve Room
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Other Nearby Stays from Google Places Search */}
                                        {places.length > 0 && (
                                            <div style={{ padding: '0 10px', marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                                <h3 style={{ marginBottom: '20px', color: '#666', fontFamily: 'Merriweather' }}>
                                                    Additional Places Found Nearby
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

                            {/* ================================================================= */}
                            {/* 1. FARMSTAY DEEP-DIVE DETAILS & LIFESTYLE MODAL */}
                            {/* ================================================================= */}
                            {selectedStayDetails && (
                                <div className="farm-modal-overlay" onClick={() => setSelectedStayDetails(null)}>
                                    <div className="farm-modal-container" onClick={e => e.stopPropagation()}>
                                        {/* Hero Header with Image */}
                                        <div className="farm-modal-hero">
                                            <img src={selectedStayDetails.image} className="farm-modal-hero-img" alt={selectedStayDetails.name} />
                                            <button className="close-modal" onClick={() => setSelectedStayDetails(null)} style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                                            <div className="farm-modal-hero-overlay">
                                                <span style={{ background: '#2d6a4f', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>📍 {selectedStayDetails.district}</span>
                                                <h2 style={{ margin: '6px 0 4px 0', fontFamily: 'Merriweather', fontSize: '1.5rem', color: '#ffffff' }}>{selectedStayDetails.name}</h2>
                                                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Hosted by {selectedStayDetails.farmer.name} • {selectedStayDetails.region}</p>
                                            </div>
                                        </div>

                                        {/* 5 Modal Tabs Header */}
                                        <div className="farm-modal-tabs-header">
                                            <button className={`farm-modal-tab-btn ${stayDetailsTab === 'rooms' ? 'active' : ''}`} onClick={() => setStayDetailsTab('rooms')}>
                                                🛏️ Rooms & Rates
                                            </button>
                                            <button className={`farm-modal-tab-btn ${stayDetailsTab === 'routine' ? 'active' : ''}`} onClick={() => setStayDetailsTab('routine')}>
                                                🌾 Farm Daily Routine
                                            </button>
                                            <button className={`farm-modal-tab-btn ${stayDetailsTab === 'menu' ? 'active' : ''}`} onClick={() => setStayDetailsTab('menu')}>
                                                🍲 Farm-to-Table Menu
                                            </button>
                                            <button className={`farm-modal-tab-btn ${stayDetailsTab === 'host' ? 'active' : ''}`} onClick={() => setStayDetailsTab('host')}>
                                                👨‍🌾 Meet Your Host
                                            </button>
                                            <button className={`farm-modal-tab-btn ${stayDetailsTab === 'reviews' ? 'active' : ''}`} onClick={() => setStayDetailsTab('reviews')}>
                                                ⭐ Reviews ({selectedStayDetails.reviews.length + (userReviewsMap[selectedStayDetails.id]?.length || 0)})
                                            </button>
                                        </div>

                                        {/* Tab Body */}
                                        <div className="farm-modal-tab-body">
                                            {/* TAB 1: ROOMS */}
                                            {stayDetailsTab === 'rooms' && (
                                                <div>
                                                    <p style={{ color: '#555', marginBottom: '20px', fontSize: '0.9rem' }}>{selectedStayDetails.desc}</p>
                                                    <h4 style={{ color: '#810000', marginBottom: '15px', fontFamily: 'Merriweather' }}>Available Accommodations:</h4>
                                                    <div className="rooms-showcase-grid">
                                                        {selectedStayDetails.rooms.map(room => (
                                                            <div key={room.id} className="room-showcase-card">
                                                                <img src={room.img} className="room-card-img" alt={room.name} />
                                                                <div className="room-card-content">
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#2d6a4f', textTransform: 'uppercase' }}>{room.type}</span>
                                                                        <span style={{ fontSize: '0.75rem', background: room.ac ? '#e0f2fe' : '#f0fdf4', color: room.ac ? '#0369a1' : '#166534', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{room.ac ? '❄️ AC Available' : '🌿 Naturally Cooled'}</span>
                                                                    </div>
                                                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontFamily: 'Merriweather', color: '#333' }}>{room.name}</h4>
                                                                    <p style={{ fontSize: '0.82rem', color: '#666', margin: '0 0 10px 0', flex: 1, lineHeight: '1.4' }}>{room.desc}</p>
                                                                    <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '12px', display: 'flex', gap: '10px' }}>
                                                                        <span>👥 {room.capacity}</span>
                                                                        <span>🛏️ {room.bed}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                                                                        <div>
                                                                            <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#810000' }}>₹{room.price}</span>
                                                                            <span style={{ fontSize: '0.75rem', color: '#777' }}> / night</span>
                                                                        </div>
                                                                        <button 
                                                                            className="btn-book-primary" 
                                                                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                                                                            onClick={() => handleOpenStayBooking(selectedStayDetails, room)}
                                                                        >
                                                                            Book This Room
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* TAB 2: DAILY ROUTINE */}
                                            {stayDetailsTab === 'routine' && (
                                                <div>
                                                    <h3 style={{ color: '#810000', margin: '0 0 8px 0', fontFamily: 'Merriweather' }}>🌾 A Day in the Life of the Farmer</h3>
                                                    <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: '25px' }}>Immerse yourself in authentic village rhythms. All activities below are complimentary for staying guests!</p>
                                                    <div className="routine-timeline">
                                                        {selectedStayDetails.dailyRoutine.map((item, idx) => (
                                                            <div key={idx} className="routine-timeline-item">
                                                                <div className="routine-timeline-dot">{idx + 1}</div>
                                                                <div className="routine-time">{item.time}</div>
                                                                <h4 className="routine-title">{item.title}</h4>
                                                                <p className="routine-desc">{item.desc}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* TAB 3: FARM MENU */}
                                            {stayDetailsTab === 'menu' && (
                                                <div>
                                                    <h3 style={{ color: '#810000', margin: '0 0 8px 0', fontFamily: 'Merriweather' }}>🍲 Taste of the Farm (All 3 Meals Included)</h3>
                                                    <p style={{ color: '#666', fontSize: '0.88rem', marginBottom: '22px' }}>100% organic, freshly plucked from the garden and prepared over firewood in traditional earthen cookware.</p>
                                                    <div className="farm-menu-grid">
                                                        <div className="farm-menu-card">
                                                            <div className="farm-menu-header">🌅 Morning Breakfast</div>
                                                            <div className="farm-menu-items">{selectedStayDetails.farmMenu.breakfast}</div>
                                                        </div>
                                                        <div className="farm-menu-card">
                                                            <div className="farm-menu-header">🍛 Banana Leaf Lunch</div>
                                                            <div className="farm-menu-items">{selectedStayDetails.farmMenu.lunch}</div>
                                                        </div>
                                                        <div className="farm-menu-card">
                                                            <div className="farm-menu-header">☕ Evening High Tea</div>
                                                            <div className="farm-menu-items">{selectedStayDetails.farmMenu.snacks}</div>
                                                        </div>
                                                        <div className="farm-menu-card">
                                                            <div className="farm-menu-header">🌙 Village Dinner</div>
                                                            <div className="farm-menu-items">{selectedStayDetails.farmMenu.dinner}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* TAB 4: MEET THE HOST */}
                                            {stayDetailsTab === 'host' && (
                                                <div style={{ background: '#fdfbf7', border: '1px solid #f3ebd8', borderRadius: '18px', padding: '24px' }}>
                                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                                                        <img src={selectedStayDetails.farmer.avatar} style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #810000' }} alt={selectedStayDetails.farmer.name} />
                                                        <div>
                                                            <h3 style={{ margin: '0 0 4px 0', color: '#810000', fontFamily: 'Merriweather' }}>{selectedStayDetails.farmer.name}</h3>
                                                            <span style={{ color: '#2d6a4f', fontWeight: 'bold', fontSize: '0.85rem' }}>🌱 {selectedStayDetails.farmer.experience}</span>
                                                            <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                {selectedStayDetails.farmer.languages.map(lang => (
                                                                    <span key={lang} style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', color: '#555' }}>🗣️ {lang}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p style={{ color: '#4b5563', lineHeight: '1.6', fontSize: '0.92rem', margin: '0 0 16px 0' }}>{selectedStayDetails.farmer.bio}</p>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#ffffff', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }}>
                                                        <div><strong>📍 Location:</strong> {selectedStayDetails.district}, Tamil Nadu</div>
                                                        <div><strong>🌾 Farming Style:</strong> 100% Zero-Budget Natural</div>
                                                        <div><strong>🐄 Farm Animals:</strong> Native Kangeyam Cattle</div>
                                                        <div><strong>⭐ Host Rating:</strong> {selectedStayDetails.rating} / 5.0</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* TAB 5: REVIEWS */}
                                            {stayDetailsTab === 'reviews' && (
                                                <div className="reviews-section">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <h4 style={{ margin: 0, fontFamily: 'Merriweather', color: '#810000' }}>Verified Guest Feedback</h4>
                                                        <span style={{ color: '#810000', fontWeight: 'bold' }}>⭐ {selectedStayDetails.rating} Rating</span>
                                                    </div>

                                                    {/* Existing and Newly Added Reviews */}
                                                    {[...(userReviewsMap[selectedStayDetails.id] || []), ...selectedStayDetails.reviews].map((rev, idx) => (
                                                        <div key={idx} className="review-item-card">
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                                <strong style={{ color: '#333' }}>{rev.user}</strong>
                                                                <span style={{ fontSize: '0.8rem', color: '#888' }}>{rev.date}</span>
                                                            </div>
                                                            <div style={{ color: '#f59e0b', fontSize: '0.85rem', marginBottom: '6px' }}>
                                                                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                                            </div>
                                                            <p style={{ margin: 0, fontSize: '0.88rem', color: '#4b5563', lineHeight: '1.45' }}>{rev.comment}</p>
                                                            {rev.favoriteActivity && (
                                                                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#2d6a4f', fontWeight: '600' }}>
                                                                    ❤️ Favorite Moment: {rev.favoriteActivity}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Add Review Box */}
                                                    <div className="add-review-box">
                                                        <h4 style={{ margin: '0 0 6px 0', color: '#b45309', fontFamily: 'Merriweather' }}>⭐ Write a Review & Earn +50 Eco Coins!</h4>
                                                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 14px 0' }}>Share your genuine farm experience with the community and earn points to redeem for organic produce.</p>
                                                        <form onSubmit={(e) => handleSubmitReview(selectedStayDetails.id, e)}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                                                <div>
                                                                    <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Your Name</label>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="e.g. Priya S." 
                                                                        value={reviewForm.userName} 
                                                                        onChange={e => setReviewForm({ ...reviewForm, userName: e.target.value })} 
                                                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.85rem' }} 
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Rating (1 to 5 Stars)</label>
                                                                    <select 
                                                                        value={reviewForm.rating} 
                                                                        onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })} 
                                                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                                                                    >
                                                                        <option value="5">⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                                                                        <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                                                                        <option value="3">⭐⭐⭐ (3 - Good)</option>
                                                                        <option value="2">⭐⭐ (2 - Average)</option>
                                                                        <option value="1">⭐ (1 - Needs Improvement)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div style={{ marginBottom: '10px' }}>
                                                                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Favorite Farm Activity</label>
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="e.g. Well swimming & cow milking" 
                                                                    value={reviewForm.favoriteActivity} 
                                                                    onChange={e => setReviewForm({ ...reviewForm, favoriteActivity: e.target.value })} 
                                                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.85rem' }} 
                                                                />
                                                            </div>
                                                            <div style={{ marginBottom: '12px' }}>
                                                                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Your Feedback & Experience</label>
                                                                <textarea 
                                                                    required 
                                                                    rows="3" 
                                                                    placeholder="Tell others about the host hospitality, food freshness, and room comfort..." 
                                                                    value={reviewForm.comment} 
                                                                    onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} 
                                                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.85rem', resize: 'vertical' }}
                                                                ></textarea>
                                                            </div>
                                                            <button 
                                                                type="submit" 
                                                                className="btn-green" 
                                                                disabled={submittingReview} 
                                                                style={{ padding: '8px 20px', fontSize: '0.85rem', background: '#b45309' }}
                                                            >
                                                                {submittingReview ? 'Submitting...' : 'Post Review & Claim +50 Coins 🪙'}
                                                            </button>
                                                        </form>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Modal Footer */}
                                        <div style={{ padding: '16px 30px', background: '#f8faf9', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <button className="btn-wood" onClick={() => setSelectedStayDetails(null)}>Close</button>
                                            <button className="btn-book-primary" style={{ padding: '10px 24px' }} onClick={() => handleOpenStayBooking(selectedStayDetails)}>
                                                Reserve Room Now ›
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ================================================================= */}
                            {/* 2. HOTEL-GRADE BOOKING & LIFESTYLE EXPERIENCE ENGINE MODAL */}
                            {/* ================================================================= */}
                            {activeStayBooking && (() => {
                                const { stay, room, checkIn, checkOut, adults, children, mealPlan, selectedAddOns, volunteerDiscount, paymentMethod } = activeStayBooking;
                                
                                const d1 = new Date(checkIn);
                                const d2 = new Date(checkOut);
                                const timeDiff = d2.getTime() - d1.getTime();
                                const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

                                const roomTotal = (room?.price || stay.price) * nights;
                                const mealDiscount = mealPlan === 'breakfast' ? 300 * adults * nights : 0;

                                let addOnsTotal = 0;
                                if (selectedAddOns && selectedAddOns.length > 0) {
                                    selectedAddOns.forEach(id => {
                                        const found = stay.farmActivities?.addOns?.find(a => a.id === id);
                                        if (found) addOnsTotal += found.price * (Number(adults) + Number(children));
                                    });
                                }

                                const subtotal = Math.max(0, roomTotal - mealDiscount) + addOnsTotal;
                                const volunteerDiscountAmount = volunteerDiscount ? Math.round(subtotal * 0.15) : 0;
                                const finalCash = Math.max(0, subtotal - volunteerDiscountAmount);
                                const finalCoins = Math.ceil(finalCash / 10);

                                return (
                                    <div className="farm-modal-overlay" onClick={() => setActiveStayBooking(null)}>
                                        <div className="farm-modal-container booking-engine-modal" onClick={e => e.stopPropagation()}>
                                            <div style={{ padding: '22px 26px', background: 'linear-gradient(135deg, #810000 0%, #580000 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 style={{ margin: 0, fontFamily: 'Merriweather', color: 'white' }}>Reserve Your Farm Retreat</h3>
                                                    <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', opacity: 0.85 }}>{stay.name} • Hosted by {stay.farmer.name}</p>
                                                </div>
                                                <button className="close-modal" onClick={() => setActiveStayBooking(null)} style={{ color: 'white', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
                                            </div>

                                            <form onSubmit={handleConfirmStayBooking} style={{ padding: '24px 26px' }}>
                                                {/* STEP 1: DATES & NIGHTS */}
                                                <div className="booking-step-section">
                                                    <div className="booking-step-title">📅 1. Select Dates ({nights} {nights === 1 ? 'Night' : 'Nights'})</div>
                                                    <div className="booking-inputs-grid">
                                                        <div>
                                                            <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Check-In Date</label>
                                                            <input 
                                                                type="date" 
                                                                required 
                                                                value={checkIn} 
                                                                min={new Date().toISOString().split('T')[0]} 
                                                                onChange={e => setActiveStayBooking({ ...activeStayBooking, checkIn: e.target.value })} 
                                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Check-Out Date</label>
                                                            <input 
                                                                type="date" 
                                                                required 
                                                                value={checkOut} 
                                                                min={checkIn} 
                                                                onChange={e => setActiveStayBooking({ ...activeStayBooking, checkOut: e.target.value })} 
                                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* STEP 2: ROOM TYPE & GUESTS */}
                                                <div className="booking-step-section">
                                                    <div className="booking-step-title">🛏️ 2. Room Type & Guests</div>
                                                    <div style={{ marginBottom: '12px' }}>
                                                        <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Select Room</label>
                                                        <select 
                                                            value={room?.id} 
                                                            onChange={e => {
                                                                const chosen = stay.rooms.find(r => r.id === e.target.value);
                                                                setActiveStayBooking({ ...activeStayBooking, room: chosen });
                                                            }}
                                                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}
                                                        >
                                                            {stay.rooms.map(r => (
                                                                <option key={r.id} value={r.id}>
                                                                    {r.name} — ₹{r.price}/night ({r.capacity}, {r.bed})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="booking-inputs-grid">
                                                        <div>
                                                            <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Adults (12+ yrs)</label>
                                                            <input 
                                                                type="number" 
                                                                min="1" 
                                                                max="8" 
                                                                required 
                                                                value={adults} 
                                                                onChange={e => setActiveStayBooking({ ...activeStayBooking, adults: Number(e.target.value) })} 
                                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Children (below 12 yrs)</label>
                                                            <input 
                                                                type="number" 
                                                                min="0" 
                                                                max="6" 
                                                                value={children} 
                                                                onChange={e => setActiveStayBooking({ ...activeStayBooking, children: Number(e.target.value) })} 
                                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ccc' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* STEP 3: MEAL PLAN */}
                                                <div className="booking-step-section">
                                                    <div className="booking-step-title">🍲 3. Meal Plan Option</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                                                            <input 
                                                                type="radio" 
                                                                name="mealPlan" 
                                                                checked={mealPlan === 'full_board'} 
                                                                onChange={() => setActiveStayBooking({ ...activeStayBooking, mealPlan: 'full_board' })} 
                                                            />
                                                            <span><strong>Full Board (Recommended)</strong> — All 3 Traditional Banana Leaf Meals & High Tea Included</span>
                                                        </label>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#666' }}>
                                                            <input 
                                                                type="radio" 
                                                                name="mealPlan" 
                                                                checked={mealPlan === 'breakfast'} 
                                                                onChange={() => setActiveStayBooking({ ...activeStayBooking, mealPlan: 'breakfast' })} 
                                                            />
                                                            <span><strong>Bed & Breakfast Only</strong> (Saves ₹300/person/night)</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* STEP 4: LIFESTYLE ADD-ONS */}
                                                {stay.farmActivities?.addOns?.length > 0 && (
                                                    <div className="booking-step-section">
                                                        <div className="booking-step-title">✨ 4. Lifestyle Experience Add-Ons (Optional)</div>
                                                        {stay.farmActivities.addOns.map(addon => {
                                                            const isChecked = selectedAddOns.includes(addon.id);
                                                            return (
                                                                <div 
                                                                    key={addon.id} 
                                                                    className="addon-checkbox-row"
                                                                    onClick={() => {
                                                                        const updated = isChecked 
                                                                            ? selectedAddOns.filter(id => id !== addon.id)
                                                                            : [...selectedAddOns, addon.id];
                                                                        setActiveStayBooking({ ...activeStayBooking, selectedAddOns: updated });
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <input type="checkbox" checked={isChecked} readOnly />
                                                                        <div>
                                                                            <strong style={{ fontSize: '0.88rem', color: '#333' }}>{addon.title}</strong>
                                                                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#666' }}>⏱ {addon.duration} • {addon.desc}</span>
                                                                        </div>
                                                                    </div>
                                                                    <span style={{ fontWeight: 'bold', color: '#810000', fontSize: '0.85rem' }}>+₹{addon.price}/person</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* STEP 5: VOLUNTEER & SAVE 15% DISCOUNT */}
                                                <div 
                                                    className="volunteer-discount-box"
                                                    onClick={() => setActiveStayBooking({ ...activeStayBooking, volunteerDiscount: !volunteerDiscount })}
                                                >
                                                    <input type="checkbox" checked={volunteerDiscount} readOnly style={{ marginTop: '3px' }} />
                                                    <div>
                                                        <strong style={{ color: '#166534', fontSize: '0.9rem' }}>🌱 Volunteer & Save 15% Instant Discount!</strong>
                                                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#15803d' }}>
                                                            Check this box if you'd like to help the farmer family for 2 hours during morning harvest (milking, weeding, or plucking).
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* STEP 6: PRICE SUMMARY */}
                                                <div className="price-summary-box">
                                                    <div className="price-summary-row">
                                                        <span>{room?.name} ({nights} {nights === 1 ? 'Night' : 'Nights'} × ₹{room?.price})</span>
                                                        <span>₹{roomTotal}</span>
                                                    </div>
                                                    {mealDiscount > 0 && (
                                                        <div className="price-summary-row" style={{ color: '#166534' }}>
                                                            <span>Bed & Breakfast Meal Adjustment</span>
                                                            <span>-₹{mealDiscount}</span>
                                                        </div>
                                                    )}
                                                    {addOnsTotal > 0 && (
                                                        <div className="price-summary-row">
                                                            <span>Experience Add-Ons Total ({Number(adults) + Number(children)} Guests)</span>
                                                            <span>+₹{addOnsTotal}</span>
                                                        </div>
                                                    )}
                                                    {volunteerDiscount && (
                                                        <div className="price-summary-row" style={{ color: '#166534', fontWeight: 'bold' }}>
                                                            <span>🌱 15% Harvest Volunteer Discount</span>
                                                            <span>-₹{volunteerDiscountAmount}</span>
                                                        </div>
                                                    )}
                                                    <div className="price-summary-total">
                                                        <span>Total Payable</span>
                                                        <span>₹{finalCash} <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'normal' }}>(or {finalCoins} Coins)</span></span>
                                                    </div>
                                                </div>

                                                {/* STEP 7: PAYMENT METHOD */}
                                                <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Select Payment Mode</label>
                                                    <select 
                                                        value={paymentMethod} 
                                                        onChange={e => setActiveStayBooking({ ...activeStayBooking, paymentMethod: e.target.value })} 
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #810000', fontWeight: 'bold' }}
                                                    >
                                                        <option value="cash">💵 Pay at Farm on Check-in (Cash / UPI) — ₹{finalCash}</option>
                                                        <option value="coins">🪙 Pay with Eco Coins (Redeem Wallet) — {finalCoins} Coins (Balance: {walletSummary.ecopoints})</option>
                                                        <option value="card">💳 Pay Online Now (Credit/Debit Card / NetBanking)</option>
                                                    </select>
                                                </div>

                                                <button type="submit" className="btn-book-primary" style={{ width: '100%', padding: '14px', fontSize: '1.05rem', borderRadius: '10px' }}>
                                                    Confirm & Reserve Farm Stay
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ================================================================= */}
                            {/* 3. DIGITAL FARM PASS BOOKING VOUCHER MODAL */}
                            {/* ================================================================= */}
                            {confirmedVoucher && (
                                <div className="farm-modal-overlay" onClick={() => setConfirmedVoucher(null)}>
                                    <div className="farm-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', padding: '24px' }}>
                                        <div className="digital-farm-pass">
                                            <div className="pass-header">
                                                <div style={{ fontSize: '0.8rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1px' }}>Tamil Nadu Agri & Rural Tourism</div>
                                                <h2 style={{ margin: '4px 0 8px 0', fontFamily: 'Merriweather', color: '#ffffff', fontSize: '1.4rem' }}>{confirmedVoucher.stayName}</h2>
                                                <span className="pass-code">PASS: {confirmedVoucher.passCode}</span>
                                            </div>

                                            <div className="pass-details-grid">
                                                <div>
                                                    <div className="pass-detail-label">Farmer Host</div>
                                                    <div className="pass-detail-val">👨‍🌾 {confirmedVoucher.farmerName}</div>
                                                </div>
                                                <div>
                                                    <div className="pass-detail-label">District & Region</div>
                                                    <div className="pass-detail-val">📍 {confirmedVoucher.district}</div>
                                                </div>
                                                <div>
                                                    <div className="pass-detail-label">Check-In / Out</div>
                                                    <div className="pass-detail-val">📅 {confirmedVoucher.checkInDate} to {confirmedVoucher.checkOutDate}</div>
                                                </div>
                                                <div>
                                                    <div className="pass-detail-label">Duration & Guests</div>
                                                    <div className="pass-detail-val">🌙 {confirmedVoucher.nights} Nights ({confirmedVoucher.numberOfGuests} Guests)</div>
                                                </div>
                                                <div>
                                                    <div className="pass-detail-label">Room Type</div>
                                                    <div className="pass-detail-val">🛏️ {confirmedVoucher.roomName}</div>
                                                </div>
                                                <div>
                                                    <div className="pass-detail-label">Meal Plan</div>
                                                    <div className="pass-detail-val">🍲 {confirmedVoucher.mealPlan}</div>
                                                </div>
                                            </div>

                                            {confirmedVoucher.addOns?.length > 0 && (
                                                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.25)', paddingTop: '10px', marginBottom: '14px', fontSize: '0.82rem' }}>
                                                    <strong>Included Experiences:</strong> {confirmedVoucher.addOns.map(a => a.title).join(', ')}
                                                </div>
                                            )}

                                            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.25)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div className="pass-detail-label">Total Amount Paid / Due</div>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{confirmedVoucher.finalAmount}</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                    {confirmedVoucher.paymentMethod === 'cash' ? 'Pay on Check-in' : 'Paid Confirmed'}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                            <a 
                                                href={`https://wa.me/919443218920?text=Vanakkam%20${encodeURIComponent(confirmedVoucher.farmerName)},%20I%20have%20booked%20a%20stay%20with%20Pass%20${confirmedVoucher.passCode}`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="btn-wood" 
                                                style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '10px', fontSize: '0.85rem' }}
                                            >
                                                💬 WhatsApp Host
                                            </a>
                                            <button 
                                                className="btn-green" 
                                                style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                                                onClick={() => {
                                                    window.print();
                                                }}
                                            >
                                                🖨️ Print Pass
                                            </button>
                                            <button 
                                                className="btn-wood" 
                                                style={{ padding: '10px 16px', fontSize: '0.85rem' }}
                                                onClick={() => setConfirmedVoucher(null)}
                                            >
                                                Done
                                            </button>
                                        </div>
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


