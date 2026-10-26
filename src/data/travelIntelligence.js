import { getCulturalEvents } from './culturalEvents';

/**
 * Temple & Heritage Intelligence Registry for Tamil Nadu
 */
export const TEMPLE_HERITAGE_HUBS = {
    madurai: {
        name: "Madurai Heritage Hub",
        temples: ["Meenakshi Amman Temple", "Koodal Azhagar Temple", "Thiruparankundram Murugan Temple"],
        darshanTimings: "Morning: 05:00 AM – 12:30 PM | Evening: 04:00 PM – 09:30 PM",
        middayRule: "Doors strictly closed 12:30 PM – 04:00 PM for Uchikala Pooja. Utilize this time for traditional lunch (Amma Mess) and the Gandhi Memorial Museum.",
        dressCode: "Mandatory traditional attire. Men: Dhoti/Veshti or Kurta-pyjama (no shorts/jeans). Women: Saree, Salwar Kameez with dupatta (no western dresses).",
        electronicsPolicy: "Mobile phones completely banned inside Meenakshi Temple. Cloakrooms available at East & South Gopuram gates (₹10/device).",
        footwearTips: "Courtyard granite stones heat up after 10:30 AM. Wear thick socks or complete parikrama along shaded coir-mat pathways.",
        insiderTip: "Witness the divine night procession (Palliarai Pooja) at 09:00 PM at Meenakshi Amman Temple."
    },
    thanjavur: {
        name: "Chola Heritage Hub",
        temples: ["Brihadisvara Temple (Big Temple)", "Thanjavur Maratha Palace", "Gangaikonda Cholapuram (nearby)"],
        darshanTimings: "Morning: 06:00 AM – 12:30 PM | Evening: 04:00 PM – 08:30 PM",
        middayRule: "Main sanctum closes at 12:30 PM. Use 1:00 PM – 4:00 PM to explore the Thanjavur Royal Palace, Art Gallery, and Tanjore Painting workshops.",
        dressCode: "Modest cultural attire recommended. Dhoti or formal trousers for men, Saree/Salwar for women.",
        electronicsPolicy: "Cameras allowed in outer UNESCO courtyards; restricted inside the sanctum sanctorum.",
        footwearTips: "Massive outdoor stone compound. Visit early morning (07:00 AM) or sunset (05:00 PM) for the best photographs and cool breeze.",
        insiderTip: "Stand beneath the 80-ton granite Kumbam at golden hour (05:30 PM) for stunning shadowless photography."
    },
    rameswaram: {
        name: "Island Sacred Circuit",
        temples: ["Ramanathaswamy Temple", "Agniteertham", "Kothandaramaswamy Temple"],
        darshanTimings: "Morning: 05:00 AM – 01:00 PM | Evening: 03:00 PM – 09:00 PM",
        middayRule: "Midday temple break 01:00 PM – 03:00 PM. Best used for seafood lunch and driving to Dhanushkodi ghost town.",
        dressCode: "Traditional wear strictly enforced. Wet clothes after theertham bath must be changed before entering the sanctum.",
        electronicsPolicy: "Mobile phones strictly prohibited in the inner corridors. Free/paid lockers available near Agniteertham.",
        footwearTips: "The walk around 22 sacred wells (Theerthams) is done barefoot. Carry an extra set of dry traditional clothes in a waterproof bag.",
        insiderTip: "Bathe in the 22 wells between 07:00 AM and 09:00 AM, then take special Spatika Linga darshan."
    },
    kanchipuram: {
        name: "City of Thousand Temples",
        temples: ["Ekambareswarar Temple", "Kailasanathar Temple", "Varadharaja Perumal Temple", "Kamakshi Amman Temple"],
        darshanTimings: "Morning: 06:00 AM – 12:30 PM | Evening: 04:00 PM – 08:30 PM",
        middayRule: "All temples observe midday closure (12:30 – 04:00 PM). Perfect window to visit authentic Kanchipuram Silk handloom cooperative societies.",
        dressCode: "Traditional conservative attire required at Kamakshi and Varadharaja Perumal temples.",
        electronicsPolicy: "Photography permitted in ancient courtyards (Kailasanathar); restricted inside active sanctums.",
        footwearTips: "Sandstone courtyards can be warm. Carry socks for temple hopping.",
        insiderTip: "Don't miss the famous Kanchipuram Idli steamed in Mandharai leaves at Sri Krishna Vilas or temple prasadam stalls."
    },
    chidambaram: {
        name: "Cosmic Dance Sanctuary",
        temples: ["Thillai Nataraja Temple", "Pichavaram Mangrove Forest (nearby)"],
        darshanTimings: "Morning: 06:00 AM – 12:00 PM | Evening: 05:00 PM – 10:00 PM",
        middayRule: "Temples closed 12:00 PM – 05:00 PM. Ideal time to take a boat cruise through the Pichavaram Mangrove swamps (15 km away).",
        dressCode: "Men must remove shirts/upper garments to enter the main sanctum (Chit Sabha). Dhotis mandatory.",
        electronicsPolicy: "No photography inside the main hall where Chidambara Rahasyam (formless darshan) takes place.",
        footwearTips: "Cool granite stone inside covered Mandapams; comfortable throughout the morning.",
        insiderTip: "Watch the Ruby Nataraja (Ratnasabhapati) Abhishekam at 10:00 AM daily."
    },
    tiruvannamalai: {
        name: "Agni Lingam & Spiritual Haven",
        temples: ["Annamalaiyar Temple", "Sri Ramana Ashram", "Girivalam 14km Path"],
        darshanTimings: "Morning: 05:30 AM – 12:30 PM | Evening: 03:30 PM – 09:30 PM",
        middayRule: "Sanctum closed 12:30 – 03:30 PM. Meditate in silence at Ramana Maharshi Ashram meditation hall (AC/shady) or enjoy satvik south Indian meals.",
        dressCode: "Traditional wear. Modest clothing covering shoulders and knees.",
        electronicsPolicy: "Mobiles deposited at temple gopuram entrance.",
        footwearTips: "Girivalam (14 km circumambulation around Arunachala hill) is done barefoot. Best started either at 04:30 AM or 09:00 PM under moonlight.",
        insiderTip: "Climb up to Virupaksha Cave on the hill in the late afternoon for profound tranquility."
    },
    palani: {
        name: "Murugan Foothill & Hilltop Shrine",
        temples: ["Dhandayuthapani Swamy Hilltop Temple", "Thiru Avinankudi Temple"],
        darshanTimings: "Morning: 06:00 AM – 08:30 PM (Continuous with brief pooja pauses)",
        middayRule: "Hilltop stays active, but rope car / winch has brief maintenance shifts around 1:00 PM.",
        dressCode: "Dhoti/shirt for men, Saree/Churidar for women. Western wear strictly banned on the steps and hill.",
        electronicsPolicy: "Mobile phones banned inside the sanctum sanctorum.",
        footwearTips: "Leave footwear at the base station before boarding the winch or climbing the 690 steps.",
        insiderTip: "Purchase official GI-tagged Palani Panchamirtham (divine fruit preserve) from HR&CE stalls atop the hill."
    },
    srirangam: {
        name: "World's Largest Functioning Temple",
        temples: ["Sri Ranganathaswamy Temple", "Rockfort Ucchi Pillayar Temple (Trichy)"],
        darshanTimings: "Morning: 06:00 AM – 01:00 PM | Evening: 03:30 PM – 09:00 PM",
        middayRule: "Midday closure 01:00 PM – 03:30 PM. Use this to travel to Trichy city, climb the 437 steps of Rockfort Temple, or enjoy banana leaf meals.",
        dressCode: "Strict traditional attire required for Vishwaroopa and Quick Darshan queues.",
        electronicsPolicy: "Camera tickets available for the 7 enclosure courtyards; no electronics inside inner sanctum.",
        footwearTips: "Huge multi-acre complex. Shaded walking carpets are laid along the main pathways.",
        insiderTip: "Climb up to the temple roof viewpoint (Chakrathazhwar tower) for an incredible 360-degree panorama of the 21 Gopurams."
    },
    chennai: {
        name: "Coastal & Heritage Capital",
        temples: ["Kapaleeshwarar Temple (Mylapore)", "Parthasarathy Temple (Triplicane)", "Marundeeswarar Temple"],
        darshanTimings: "Morning: 06:00 AM – 12:30 PM | Evening: 04:00 PM – 09:00 PM",
        middayRule: "Midday closure 12:30 PM – 04:00 PM. Perfect window for Mylapore heritage shopping, lunch at Rayar's Mess, or visiting the Santhome Cathedral.",
        dressCode: "Traditional or smart formal Indian attire.",
        electronicsPolicy: "Mobiles on silent mode; sanctum photography strictly prohibited.",
        footwearTips: "Mylapore temple tank has clean footwear stands at the East and West entrances.",
        insiderTip: "Combine the 05:00 PM Kapaleeshwarar Darshan with a steaming tumbler of filter coffee at Mylapore Degree Coffee shop."
    }
};

/**
 * Culinary Specialties & Deep Linking Data
 */
export const CULINARY_REGIONS = {
    madurai: {
        region: "Madurai",
        title: "Madurai Street Food & Royal Flavors",
        specialties: ["Bun Parotta", "Famous Jigarthanda", "Kari Dosa", "Fluffy Idlis with 4 Chutneys", "Mutton Sukka"],
        famousSpots: ["Murugan Idli Shop", "Famous Jigarthanda (East Gate)", "Amma Mess", "Simmakkal Konar Kadai"],
        tagline: "Bold, spicy, midnight food culture with royal Pandyan heritage.",
        link: "/culinary"
    },
    chettinad: {
        region: "Chettinad",
        title: "Aromatic 24-Spice Chettinad Heritage",
        specialties: ["Chettinad Pepper Chicken", "Seeyam & Kozhukattai", "Kavuni Arisi (Black Rice)", "Vellai Paniyaram"],
        famousSpots: ["The Bangala (Karaikudi)", "Annamalai Mess", "Chettinad Heritage Mansion Kitchens"],
        tagline: "World-renowned culinary mastery using hand-ground spices and kalpasi.",
        link: "/culinary"
    },
    kongu: {
        region: "Kongu Nadu",
        title: "Kongu Nadu Native Agri Cuisine",
        specialties: ["Pallipalayam Chicken", "Arisi Paruppu Sadam", "Santhakai (Rice Noodles)", "Coconut Milk Payasam"],
        famousSpots: ["Junior Kuppanna", "Hari Bhavanam (Coimbatore)", "Kongu Mess (Salem)"],
        tagline: "Subtle, health-centric cuisine celebrating tender coconut, turmeric, and millets.",
        link: "/culinary"
    },
    coastal: {
        region: "Coastal Chennai",
        title: "Coastal Tamarind & Street Feasts",
        specialties: ["Madras Meen Kuzhambu (Fish Curry)", "Marina Beach Sundal", "Degree Filter Coffee", "Crispy Medu Vada"],
        famousSpots: ["Rayar's Mess (Mylapore)", "Nair Mess (Triplicane)", "Ratna Cafe (Triplicane Sambhar)"],
        tagline: "Fresh catch of the Coromandel coast infused with curry leaves and tangy tamarind.",
        link: "/culinary"
    },
    thanjavur: {
        region: "Thanjavur & Delta",
        title: "Delta Agricultural Feast & Degree Coffee",
        specialties: ["Kumbakonam Brass-Tumbler Degree Coffee", "Kadappa with Idli", "Thanjavur Ash Gourd Halwa", "Mor Kuzhambu"],
        famousSpots: ["Venkatramana Mess", "Kumbakonam Degree Coffee Stalls", "Sri Krishna Vilas"],
        tagline: "Pure vegetarian gastronomic traditions perfected over centuries in Chola agraharams.",
        link: "/culinary"
    },
    tirunelveli: {
        region: "Tirunelveli & South TN",
        title: "Nellai Halwa & River Sodhi Treats",
        specialties: ["Hot Iruttu Kadai Halwa (Wheat)", "Tirunelveli Sodhi (Coconut milk stew)", "Parotta with Salna"],
        famousSpots: ["Iruttu Kadai (opens 05:30 PM)", "Shanthi Sweets", "Nellai Saravana Vilas"],
        tagline: "Thamirabarani river richness creating India's most celebrated molten halwa.",
        link: "/culinary"
    },
    nilgiris: {
        region: "Nilgiris & Hills",
        title: "Hills Delights & Artisan Brews",
        specialties: ["Nilgiri High-Grown BOP Tea", "Handcrafted Chocolates", "Crisp Ooty Varkey", "English Plum Preserves"],
        famousSpots: ["King Star Bakery (Ooty)", "Moddy's Confectionery", "Glenmorgan Tea Estate Cafe"],
        tagline: "Colonial-era bakeries, artisanal chocolates, and freshly brewed mountain tea.",
        link: "/culinary"
    }
};

/**
 * Agri-Tourism Plantation & Rural Life Trails
 */
export const AGRI_EXPERIENCES = {
    nilgiris: {
        location: "Nilgiris (Ooty & Coonoor)",
        title: "Nilgiris Misty Tea Estate Trail",
        activities: ["Tea Leaf Plucking with Artisans", "Orthodox Tea Factory Demonstration", "Herbal Botanical Walk", "High-Elevation Tea Tasting"],
        season: "Year-round (Crisp & invigorating)",
        stayType: "Heritage Planter Bungalows",
        link: "/agri"
    },
    valparai: {
        location: "Valparai & Anamalai Hills",
        title: "Rainforest Shade-Grown Coffee Trail",
        activities: ["Arabica & Robusta Coffee Picking", "Stream Walks & Lion-tailed Macaque Spotting", "Organic Pepper Harvesting"],
        season: "Oct – Mar (Coffee Harvest Period)",
        stayType: "Estate Heritage Homestays",
        link: "/agri"
    },
    pollachi: {
        location: "Pollachi & Anamalai Foothills",
        title: "Tender Coconut Groves & Village Life",
        activities: ["Tender Coconut Harvesting Demo", "Village Bullock-Cart Ride along Coconut Canals", "Traditional Pottery & Weaving", "Farm-Fresh Banana Leaf Lunch"],
        season: "Year-round",
        stayType: "Eco-Farm Stays with Ayurveda Wellness",
        link: "/agri"
    },
    kodaikanal: {
        location: "Kodaikanal (Palani Hills)",
        title: "Organic Orchard & Terrace Farming",
        activities: ["Plum & Pear Picking in Season", "Organic Garlic & Herb Workshop", "Terrace Valley Trekking", "Farm-to-Fork Woodfired Dining"],
        season: "Aug – Dec (Fruit Harvesting)",
        stayType: "Organic Farm Cabins & Tents",
        link: "/agri"
    },
    yercaud: {
        location: "Yercaud (Shevaroy Hills)",
        title: "Orange Groves & Black Pepper Trails",
        activities: ["Orange Grove Walking Tour", "Black Pepper Harvesting", "Coffee Bean Drying Demonstration"],
        season: "Oct – Feb",
        stayType: "Eco-friendly Hillside Cottages",
        link: "/agri"
    }
};

/**
 * Curated Verified Local Guides
 */
export const CURATED_LOCAL_GUIDES = [
    {
        id: "1",
        name: "Arun Kumar",
        location: "Salem",
        rating: 4.8,
        reviewsCount: 124,
        languages: ["English", "Tamil"],
        price: "₹500/hr",
        specialty: "Historical Sites & Salem Forts",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        bio: "Certified historical guide with deep knowledge of ancient architecture, hill sanctuaries, and local legends."
    },
    {
        id: "2",
        name: "Priya Sharma",
        location: "Chennai",
        rating: 4.9,
        reviewsCount: 215,
        languages: ["English", "Hindi", "Tamil"],
        price: "₹800/hr",
        specialty: "Cultural Heritage & Coastal Traditions",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        bio: "Specializes in Chennai's colonial history, Mylapore temple folklore, and authentic culinary food walks."
    },
    {
        id: "7",
        name: "Muthukumar S.",
        location: "Madurai",
        rating: 4.9,
        reviewsCount: 310,
        languages: ["English", "Tamil", "French"],
        price: "₹700/hr",
        specialty: "Meenakshi Temple Architecture & Legends",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        bio: "HR&CE approved historian guide with 12+ years uncovering hidden sculptural details of the Nayakkar dynasty."
    },
    {
        id: "8",
        name: "Kavitha Ranganathan",
        location: "Thanjavur",
        rating: 4.8,
        reviewsCount: 178,
        languages: ["English", "Tamil"],
        price: "₹650/hr",
        specialty: "Great Living Chola Temples & Bronze Art",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        bio: "Passionate about Chola architecture, epigraphy, Tanjore royal paintings, and classical dance history."
    },
    {
        id: "3",
        name: "Ravi Menon",
        location: "Nilgiris",
        rating: 4.7,
        reviewsCount: 95,
        languages: ["English", "Malayalam", "Tamil"],
        price: "₹600/hr",
        specialty: "Nature Trails, Tea Estates & Birdwatching",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        bio: "Naturalist guide who takes you off tourist trails to explore Nilgiri biosphere flora, fauna, and indigenous Toda culture."
    },
    {
        id: "9",
        name: "Selvaraj Pandian",
        location: "Rameswaram",
        rating: 4.8,
        reviewsCount: 142,
        languages: ["English", "Tamil", "Hindi"],
        price: "₹550/hr",
        specialty: "Sacred Theerthams & Dhanushkodi Trails",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        bio: "Expert on Ramayana heritage trails, coral island biodiversity, and navigating Dhanushkodi sand tracks."
    }
];

/**
 * Intelligent Matchers for Itinerary Generation
 */

// 1. Detect active cultural festivals matching destination and date range
export const detectCulturalFestivals = (city = '', startDate, endDate) => {
    if (!startDate) return [];
    const dummyT = (k, fallback) => fallback;
    const allEvents = getCulturalEvents(dummyT);
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate);
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const cityLower = city.toLowerCase();

    return allEvents.filter(event => {
        // Match by month
        const monthMatches = (event.monthIndex >= startMonth && event.monthIndex <= endMonth);
        if (!monthMatches) return false;

        // Specific city match if applicable
        const titleLower = (event.title || '').toLowerCase();
        const descLower = (event.longDesc || '').toLowerCase();

        if (cityLower) {
            if (cityLower.includes('madurai') && (titleLower.includes('chithirai') || descLower.includes('madurai'))) return true;
            if (cityLower.includes('ooty') && (titleLower.includes('flower') || descLower.includes('ooty'))) return true;
            if (cityLower.includes('chennai') && (titleLower.includes('margazhi') || descLower.includes('chennai'))) return true;
            if (cityLower.includes('palani') && (titleLower.includes('thaipusam') || descLower.includes('palani'))) return true;
            if (cityLower.includes('chidambaram') && (titleLower.includes('natyanjali') || descLower.includes('chidambaram'))) return true;
            if (cityLower.includes('thiruvannamalai') || cityLower.includes('tiruvannamalai')) {
                if (titleLower.includes('karthigai') || descLower.includes('tiruvannamalai')) return true;
            }
        }

        // Return major statewide festivals falling in that month (Pongal, Deepavali, Puthandu)
        return true;
    });
};

// 2. Resolve Temple Intelligence based on City & Travel Interest
export const getTempleIntelligence = (city = '', placeType = '') => {
    const cityLower = city.toLowerCase().trim();
    for (const [key, hub] of Object.entries(TEMPLE_HERITAGE_HUBS)) {
        if (cityLower.includes(key)) {
            return hub;
        }
    }
    // If interest is temple/heritage and no specific city hub matched
    if (placeType === 'temple') {
        return {
            name: `${city} Heritage Protocol`,
            temples: ["Local Historic Shrines"],
            darshanTimings: "Morning: 06:00 AM – 12:00 PM | Evening: 04:30 PM – 08:30 PM",
            middayRule: "Traditional Agamic temples close 12:30 PM – 04:00 PM. Reserve afternoons for resting, lunch, or indoor handicrafts.",
            dressCode: "Conservative attire: Men in Dhotis/formal trousers, Women in Sarees/Salwars.",
            electronicsPolicy: "Respect signage regarding photography in sanctum areas.",
            footwearTips: "Leave footwear at designated safe counters; granite stones can get warm after midday.",
            insiderTip: "Participate in early morning Sayaratchai or evening Deeparadhana for serene vibes."
        };
    }
    return null;
};

// 3. Resolve Culinary Highlights based on City
export const getCulinaryMatches = (city = '') => {
    const cityLower = city.toLowerCase();
    if (cityLower.includes('madurai')) return CULINARY_REGIONS.madurai;
    if (cityLower.includes('karaikudi') || cityLower.includes('chettinad') || cityLower.includes('sivagangai') || cityLower.includes('pudukkottai')) {
        return CULINARY_REGIONS.chettinad;
    }
    if (cityLower.includes('coimbatore') || cityLower.includes('salem') || cityLower.includes('erode') || cityLower.includes('tiruppur')) {
        return CULINARY_REGIONS.kongu;
    }
    if (cityLower.includes('chennai') || cityLower.includes('mahabalipuram') || cityLower.includes('kanchipuram') || cityLower.includes('pondicherry')) {
        return CULINARY_REGIONS.coastal;
    }
    if (cityLower.includes('thanjavur') || cityLower.includes('kumbakonam') || cityLower.includes('trichy') || cityLower.includes('mayiladuthurai')) {
        return CULINARY_REGIONS.thanjavur;
    }
    if (cityLower.includes('tirunelveli') || cityLower.includes('tenkasi') || cityLower.includes('kanyakumari') || cityLower.includes('tuticorin') || cityLower.includes('thoothukudi')) {
        return CULINARY_REGIONS.tirunelveli;
    }
    if (cityLower.includes('ooty') || cityLower.includes('coonoor') || cityLower.includes('kotagiri') || cityLower.includes('nilgiris')) {
        return CULINARY_REGIONS.nilgiris;
    }
    // Default fallback
    return CULINARY_REGIONS.coastal;
};

// 4. Resolve Agri Experiences based on City
export const getAgriMatches = (city = '') => {
    const cityLower = city.toLowerCase();
    if (cityLower.includes('ooty') || cityLower.includes('coonoor') || cityLower.includes('kotagiri') || cityLower.includes('nilgiris')) {
        return AGRI_EXPERIENCES.nilgiris;
    }
    if (cityLower.includes('valparai') || cityLower.includes('anamalai')) {
        return AGRI_EXPERIENCES.valparai;
    }
    if (cityLower.includes('pollachi') || cityLower.includes('coimbatore')) {
        return AGRI_EXPERIENCES.pollachi;
    }
    if (cityLower.includes('kodaikanal') || cityLower.includes('palani')) {
        return AGRI_EXPERIENCES.kodaikanal;
    }
    if (cityLower.includes('yercaud') || cityLower.includes('salem')) {
        return AGRI_EXPERIENCES.yercaud;
    }
    return null;
};

// 5. Resolve Matched Guides for the City
export const getMatchedGuides = (city = '') => {
    const cityLower = city.toLowerCase().trim();
    const matched = CURATED_LOCAL_GUIDES.filter(guide => 
        cityLower.includes(guide.location.toLowerCase()) || 
        guide.location.toLowerCase().includes(cityLower)
    );
    if (matched.length > 0) return matched;
    // Fallback to top rated guides across TN
    return CURATED_LOCAL_GUIDES.slice(0, 2);
};

// 6. Build Cultural System Guidelines to inject into Gemini Prompt
export const buildCulturalPromptInstructions = (city, startDate, endDate, placeType) => {
    const templeInfo = getTempleIntelligence(city, placeType);
    const culinaryInfo = getCulinaryMatches(city);
    const agriInfo = getAgriMatches(city);

    let instructions = `
**CRITICAL TAMIL NADU CULTURAL & TIMING RULES:**
1. **Temple Agamic Schedule**:
   - Temples observe strict midday closure between 12:30 PM and 04:00 PM (doors closed for Uchikala Pooja).
   - NEVER schedule temple visits in the midday slot.
   - Schedule temples either in the Morning (06:00 - 11:30 AM) to avoid scorching stone floors, or in the Evening (04:30 - 08:30 PM) for serene Deeparadhana.
   - For midday (12:30 - 04:00 PM), schedule authentic regional lunch, indoor AC museums, or traditional handicraft/silk shopping.

2. **Native Gastronomy Pairing**:
   - Recommend iconic, authentic local specialties for every lunch and dinner.
   ${culinaryInfo ? `- Focus on: ${culinaryInfo.specialties.slice(0, 4).join(', ')} (e.g., at ${culinaryInfo.famousSpots[0]}).` : ''}

3. **Attire & Cultural Etiquette**:
   - Explicitly note temple dress codes: Traditional attire (Dhoti/Kurta for men, Saree/Salwar for women) and mention locker requirements for mobile phones where applicable.
`;

    if (agriInfo) {
        instructions += `
4. **Agri-Tourism Highlight**:
   - This region has renowned plantation/farm experiences (${agriInfo.title}). Integrate a brief stop for ${agriInfo.activities[0]} during the morning or afternoon.
`;
    }

    return instructions;
};
