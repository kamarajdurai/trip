import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './WhereToGo.css';

const categories = [
    { id: 'hills', name: 'Hills', emoji: '🏔️', title: 'Famous Hill Stations', img: '/where-to-go/hill.jpg' },
    { id: 'beaches', name: 'Beaches', emoji: '🏖️', title: 'Serene Coastal Escapes', img: '/where-to-go/beach.jpg' },
    { id: 'monuments', name: 'Monuments', emoji: '🏛️', title: 'Historical Marvels', img: '/where-to-go/mounments.jpg' },
    { id: 'religious', name: 'Religious Places', emoji: '🛕', title: 'Spiritual Destinations', img: '/where-to-go/religios.jpg' },
    { id: 'museums', name: 'Museums', emoji: '🖼️', title: 'Treasures of History', img: '/where-to-go/mesume.jpg' },
    { id: 'dams', name: 'Dams', emoji: '🌊', title: 'Engineering Wonders', img: '/where-to-go/dam.jpg' },
    { id: 'wildlife', name: 'Wildlife / Forest', emoji: '🌲', title: 'Nature & Wildlife', img: '/where-to-go/wild.jpg' },
    { id: 'adventure', name: 'Adventure Spots', emoji: '🧗', title: 'Thrill Seekers Zone', img: '/where-to-go/adventure.jpg' },
    { id: 'food', name: 'Local Dishes / Food', emoji: '🍲', title: 'Culinary Delights', img: '/where-to-go/foood.jpg' },
    { id: 'culture', name: 'Cultural & Festivals', emoji: '🎭', title: 'Heritage & Traditions', img: '/where-to-go/culture.jpg' },
];

const placesData = {
    hills: [
        { id: 'ooty', name: 'Ooty', tag: 'Queen of Hills', image: '/where-to-go/ooty.jpg', location: 'Nilgiris', bestTime: 'March - June', occasions: 'Family / Honeymoon', budget: '₹6k - ₹15k+' },
        { id: 'kodaikanal', name: 'Kodaikanal', tag: 'Princess of Hills', image: '/where-to-go/kodaikanal.jpg', location: 'Dindigul', bestTime: 'April - June', occasions: 'Nature / Couples', budget: '₹5k - ₹13k+' },
        { id: 'yercaud', name: 'Yercaud', tag: 'Jewel of the South', image: '/where-to-go/yercaud.jpg', location: 'Salem', bestTime: 'May - June', occasions: 'Weekend Trip', budget: '₹4k - ₹10k+' },
        { id: 'coonoor', name: 'Coonoor', tag: 'Lush Tea Valleys', image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?q=80&w=800&auto=format&fit=crop', location: 'Nilgiris', bestTime: 'Oct - March', occasions: 'Tea Tours', budget: '₹6k - ₹18k+' },
        { id: 'valparai', name: 'Valparai', tag: 'Wildlife Sanctuary', image: '/where-to-go/valparai.jpg', location: 'Coimbatore', bestTime: 'Jan - May', occasions: 'Wildlife / Rainforest', budget: '₹5k - ₹12k+' },
        { id: 'kotagiri', name: 'Kotagiri', tag: 'Quiet Nilgiri Charm', image: '/where-to-go/kotagiri.jpg', location: 'Nilgiris', bestTime: 'Dec - May', occasions: 'Trekking / Solitude', budget: '₹4k - ₹9k+' },
        { id: 'meghamalai', name: 'Meghamalai', tag: 'High Wavy Mountains', image: '/where-to-go/meghamalai.jpg', location: 'Theni', bestTime: 'Sept - May', occasions: 'Cloud Forests', budget: '₹3k - ₹8k+' },
        { id: 'kolli-hills', name: 'Kolli Hills', tag: '70 Hairpin Bends', image: '/where-to-go/kolli-hills.jpg', location: 'Namakkal', bestTime: 'All Year', occasions: 'Biking / Agaya Gangai', budget: '₹2k - ₹6k+' },
        { id: 'yelagiri', name: 'Yelagiri Hills', tag: 'Paragliding Hub', image: '/where-to-go/yelagiri.jpg', location: 'Tirupattur', bestTime: 'Nov - Feb', occasions: 'Adventure / Treks', budget: '₹3k - ₹8k+' },
        { id: 'kolukkumalai', name: 'Kolukkumalai', tag: 'Highest Tea Estate', image: '/where-to-go/kolukumalai.jpg', location: 'Theni Border', bestTime: 'Sept - May', occasions: 'Sunrise Cloud Safari', budget: '₹4k - ₹9k+' },
        { id: 'javadhu-hills', name: 'Javadhu Hills', tag: 'Stargazing & Falls', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', location: 'Tirupattur / T.V. Malai', bestTime: 'Oct - March', occasions: 'Waterfalls / Observatory', budget: '₹2k - ₹5k' },
        { id: 'sirumalai', name: 'Sirumalai Hills', tag: 'Sanctuary of Sages', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop', location: 'Dindigul', bestTime: 'Oct - March', occasions: 'Wellness / Viewpoints', budget: '₹2k - ₹5k' },
        { id: 'topslip', name: 'Topslip & Anamalai', tag: 'Elephant Canopy', image: '/where-to-go/anaimalai.jpg', location: 'Pollachi', bestTime: 'Oct - April', occasions: 'Jungle Safari', budget: '₹4k - ₹11k+' },
        { id: 'manjolai', name: 'Manjolai Hills', tag: 'Tea in the Clouds', image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop', location: 'Tirunelveli', bestTime: 'Nov - March', occasions: 'Offbeat Rainforest', budget: '₹3k - ₹8k' },
        { id: 'kurangani', name: 'Kurangani Hills', tag: 'Misty Valley Trek', image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=800&auto=format&fit=crop', location: 'Theni', bestTime: 'Oct - March', occasions: 'Highland Hiking', budget: '₹2.5k - ₹6k' },
        { id: 'velliangiri', name: 'Velliangiri Hills', tag: 'Sacred Seven Hills', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', location: 'Coimbatore', bestTime: 'Feb - May', occasions: 'Spiritual Treks', budget: '₹1.5k - ₹4k' },
        { id: 'kalrayan-hills', name: 'Kalrayan Hills', tag: 'Periyar Falls Trail', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', location: 'Kallakurichi', bestTime: 'Sept - Jan', occasions: 'Eastern Ghats Trek', budget: '₹2k - ₹5k' },
        { id: 'pachaimalai', name: 'Pachaimalai Hills', tag: 'Emerald Green Range', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop', location: 'Tiruchirappalli', bestTime: 'Sept - Feb', occasions: 'Eco-Tourism Trails', budget: '₹1.5k - ₹4k' }
    ],
    beaches: [
        { id: 'marina', name: 'Marina Beach', tag: 'Urban Shore', image: '/where-to-go/marina.jpg', location: 'Chennai', bestTime: 'Nov - Feb', occasions: 'Evening Walk', budget: '₹500 - ₹5k+' },
        { id: 'elliots', name: 'Elliot\'s Beach', tag: 'Calm Vibes', image: '/where-to-go/elliot beach.webp', location: 'Besant Nagar', bestTime: 'Dec - March', occasions: 'Hangouts', budget: '₹500 - ₹3k+' },
        { id: 'mahals-beach', name: 'Mahabalipuram', tag: 'Sculpted Coast', image: '/where-to-go/mahabalipuram.jpg', location: 'Kancheepuram', bestTime: 'Dec - Feb', occasions: 'History / Surfing', budget: '₹3k - ₹10k+' },
        { id: 'kovalam', name: 'Kovalam Beach', tag: 'Surf & Sand', image: '/where-to-go/kovlam beach.webp', location: 'Chennai Outskirts', bestTime: 'Nov - March', occasions: 'Surfing', budget: '₹2k - ₹8k+' },
        { id: 'rameswaram-beach', name: 'Rameswaram Agnitheertham', tag: 'Spiritual Shore', image: '/where-to-go/rameswaram.webp', location: 'Rameswaram', bestTime: 'All Year', occasions: 'Holy Dip & Sunrise', budget: '₹3k - ₹9k+' },
        { id: 'dhanushkodi', name: 'Dhanushkodi Beach', tag: 'End of Land', image: '/where-to-go/Dhanushkodi.jpeg', location: 'Rameswaram Island', bestTime: 'Oct - Feb', occasions: 'Ocean Junction & Ruins', budget: '₹2k - ₹5k' },
        { id: 'kanyakumari', name: 'Kanyakumari Beach', tag: 'Triveni Sangam', image: '/where-to-go/kanyakumari.webp', location: 'Cape Comorin', bestTime: 'Nov - Jan', occasions: 'Sunrise & Sunset', budget: '₹4k - ₹12k+' },
        { id: 'thiruchendur', name: 'Thiruchendur Beach', tag: 'Divine Coastline', image: '/where-to-go/tiruchendur.jpg', location: 'Tuticorin', bestTime: 'Oct - March', occasions: 'Temple Coastal Dip', budget: '₹2k - ₹7k' },
        { id: 'silver-beach', name: 'Silver Beach', tag: 'Gold & Silver Sands', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', location: 'Cuddalore', bestTime: 'Nov - Feb', occasions: 'Water Sports & Horse Rides', budget: '₹1.5k - ₹4k' },
        { id: 'poompuhar-beach', name: 'Poompuhar Beach', tag: 'Ancient Chola Port', image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=800&auto=format&fit=crop', location: 'Mayiladuthurai', bestTime: 'Oct - March', occasions: 'Heritage & Sea Breeze', budget: '₹1.5k - ₹4k' },
        { id: 'muttom-beach', name: 'Muttom Beach', tag: 'Red Rock Cliffs', image: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?q=80&w=800&auto=format&fit=crop', location: 'Kanyakumari', bestTime: 'Nov - Feb', occasions: 'Lighthouse & Sunset', budget: '₹2k - ₹6k' },
        { id: 'manapad-beach', name: 'Manapad Coastal Dunes', tag: 'Surfer\'s Paradise', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=800&auto=format&fit=crop', location: 'Thoothukudi', bestTime: 'Oct - March', occasions: 'Kite Surfing & Heritage', budget: '₹2.5k - ₹6k' },
        { id: 'tranquebar-beach', name: 'Tranquebar Ozone Beach', tag: 'Danish Colony Coast', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop', location: 'Nagapattinam', bestTime: 'Nov - March', occasions: 'Colonial Fort & Peace', budget: '₹3k - ₹8k' },
        { id: 'vattakottai-beach', name: 'Vattakottai Coastal Fort', tag: 'Sea Fortress Beach', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', location: 'Kanyakumari', bestTime: 'Oct - March', occasions: 'Scenic Bastions & Waves', budget: '₹2k - ₹5k' }
    ],
    monuments: [
        { id: 'brihadeeswarar', name: 'Big Temple (Thanjavur)', tag: 'UNESCO Pinnacle', image: '/where-to-go/big_temple.jpg', location: 'Thanjavur', bestTime: 'Oct - March', occasions: 'Chola Architecture', budget: '₹2k - ₹8k+' },
        { id: 'shore-temple', name: 'Shore Temple', tag: 'Pallava Pride', image: '/where-to-go/shore temple.jpg', location: 'Mamallapuram', bestTime: 'Dec - Feb', occasions: 'Rock Sculptures', budget: '₹2k - ₹7k+' },
        { id: 'gangaikonda', name: 'Gangaikonda Cholapuram', tag: 'Chola Imperial City', image: '/where-to-go/Gangai-Konda-Cholapuram.jpg', location: 'Ariyalur', bestTime: 'Winter', occasions: 'Heritage Wonders', budget: '₹1k - ₹4k' },
        { id: 'fort-st-george', name: 'Fort St. George', tag: 'Colonial Gateway', image: '/where-to-go/fort st george.jpg', location: 'Chennai', bestTime: 'Nov - Feb', occasions: 'Museum & Fort Walk', budget: '₹500 - ₹2k' },
        { id: 'gingee-fort', name: 'Gingee Fort', tag: 'Troy of the East', image: '/where-to-go/gingee.jpg', location: 'Villupuram', bestTime: 'Winter', occasions: 'Fort Trekking', budget: '₹1k - ₹3k' },
        { id: 'vellore-fort', name: 'Vellore Fort', tag: 'Sprawling Stone Moat', image: '/where-to-go/vellore_fort.jpg', location: 'Vellore', bestTime: 'Oct - Feb', occasions: 'Family & Military History', budget: '₹1k - ₹4k' },
        { id: 'thirumalai-palace', name: 'Thirumalai Nayakkar Mahal', tag: 'Stately Giant Pillars', image: '/where-to-go/nayakkar palave.jpg', location: 'Madurai', bestTime: 'Any Day', occasions: 'Light & Sound Show', budget: '₹200 - ₹1k' },
        { id: 'chettinad-mansions', name: 'Chettinad Mansions', tag: 'Aristocratic Heritage', image: '/where-to-go/chettinad mansion2.jpg', location: 'Karaikudi', bestTime: 'Winter', occasions: 'Woodwork & Palace Tours', budget: '₹5k - ₹15k+' },
        { id: 'darasuram-temple', name: 'Airavatesvara (Darasuram)', tag: 'Musical Stone Steps', image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=800&auto=format&fit=crop', location: 'Kumbakonam', bestTime: 'Oct - March', occasions: 'UNESCO Chola Marvel', budget: '₹2k - ₹6k' },
        { id: 'padmanabhapuram', name: 'Padmanabhapuram Palace', tag: 'Masterpiece Wooden Palace', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop', location: 'Kanyakumari District', bestTime: 'Nov - Feb', occasions: 'Royal Architecture', budget: '₹1.5k - ₹4k' },
        { id: 'rockfort-trichy', name: 'Tiruchirappalli Rockfort', tag: 'Ancient Citadel Peak', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=800&auto=format&fit=crop', location: 'Trichy', bestTime: 'Oct - March', occasions: 'Cave Temples & City View', budget: '₹1k - ₹3k' },
        { id: 'danish-fort', name: 'Fort Dansborg', tag: 'Scandinavian Fortress', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop', location: 'Tranquebar', bestTime: 'Nov - Feb', occasions: 'Coastal Fort History', budget: '₹2k - ₹5k' },
        { id: 'pancharathas', name: 'Pancharathas (Five Rathas)', tag: 'Monolithic Rock Art', image: 'https://images.unsplash.com/photo-1588096344356-9a2c3a502c34?q=80&w=800&auto=format&fit=crop', location: 'Mamallapuram', bestTime: 'Dec - Feb', occasions: 'Carved Chariots', budget: '₹1.5k - ₹4k' },
        { id: 'thanjavur-palace', name: 'Thanjavur Maratha Palace', tag: 'Royal Art & Bell Tower', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=800&auto=format&fit=crop', location: 'Thanjavur', bestTime: 'Winter', occasions: 'Art Museum & Saraswathi Mahal', budget: '₹1k - ₹3k' }
    ],
    religious: [
        { id: 'meenakshi-temple', name: 'Meenakshi Amman Temple', tag: 'Divine Architectural Wonder', image: '/where-to-go/meenakshi.jpg', location: 'Madurai', bestTime: 'Winter', occasions: 'Spiritual Darshan', budget: '₹3k - ₹10k+' },
        { id: 'palani', name: 'Palani Murugan Temple', tag: 'Sacred Hilltop Shrine', image: '/where-to-go/palaani.jpg', location: 'Palani', bestTime: 'All Year', occasions: 'Winch / Ropeway Devotion', budget: '₹2k - ₹6k' },
        { id: 'chidambaram', name: 'Nataraja Temple', tag: 'Akasha Cosmic Dance', image: '/where-to-go/nataraja temple.avif', location: 'Chidambaram', bestTime: 'Winter', occasions: 'Gold Roof & Natyanjali', budget: '₹2k - ₹6k' },
        { id: 'velankanni', name: 'Velankanni Basilica', tag: 'Lady of Good Health', image: '/where-to-go/velankanni.jpg', location: 'Nagapattinam', bestTime: 'Sept - May', occasions: 'Pilgrimage & Peace', budget: '₹3k - ₹8k' },
        { id: 'nagore', name: 'Nagore Dargah', tag: 'Beacon of Harmony', image: '/where-to-go/nagore dargah.jpg', location: 'Nagore', bestTime: 'All Year', occasions: 'Spiritual Serenity', budget: '₹2k - ₹5k' },
        { id: 'golden-temple', name: 'Sripuram Golden Temple', tag: '1500kg Pure Gold', image: '/where-to-go/sripuram.webp', location: 'Vellore', bestTime: 'Evening', occasions: 'Star-path Walk', budget: '₹1k - ₹4k' },
        { id: 'srirangam', name: 'Srirangam Ranganathaswamy', tag: 'Largest Functioning Temple', image: '/where-to-go/srirangam.jpg', location: 'Trichy', bestTime: 'All Year', occasions: '21 Gopurams & Rajagopuram', budget: '₹2k - ₹7k' },
        { id: 'iskcon', name: 'ISKCON Chennai', tag: 'Radha Krishna Temple', image: '/where-to-go/iSKCON.jpg', location: 'ECR Chennai', bestTime: 'Evening', occasions: 'Meditation & Aarti', budget: '₹200 - ₹2k' },
        { id: 'rameshwaram-temple', name: 'Ramanathaswamy Temple', tag: 'Longest Corridor in World', image: '/where-to-go/rameswaram.webp', location: 'Rameswaram', bestTime: 'All Year', occasions: '22 Holy Teerthams', budget: '₹3k - ₹8k' },
        { id: 'thiruvannamalai', name: 'Annamalaiyar Temple', tag: 'Agni Fire Lingam', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop', location: 'Tiruvannamalai', bestTime: 'Oct - March', occasions: 'Girivalam & Karthigai Deepam', budget: '₹2k - ₹6k' },
        { id: 'kanchi-kamakshi', name: 'Kanchi Kamakshi & Ekambareswarar', tag: 'City of 1000 Temples', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=800&auto=format&fit=crop', location: 'Kanchipuram', bestTime: 'Oct - March', occasions: 'Prithvi Earth Element', budget: '₹1.5k - ₹5k' },
        { id: 'swamimalai', name: 'Swamimalai Murugan Temple', tag: 'Arupadaiveedu 4th Shrine', image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=800&auto=format&fit=crop', location: 'Kumbakonam', bestTime: 'All Year', occasions: '60 Steps Elevation', budget: '₹1.5k - ₹4k' },
        { id: 'suchindram', name: 'Suchindram Thanumalayan', tag: 'Trinity Shiva-Vishnu-Brahma', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop', location: 'Kanyakumari', bestTime: 'Nov - Feb', occasions: 'Musical Pillars & Hanuman', budget: '₹2k - ₹5k' },
        { id: 'santhome-cathedral', name: 'Santhome Cathedral', tag: 'Apostle St. Thomas Shrine', image: 'https://images.unsplash.com/photo-1548625361-195feee13f70?q=80&w=800&auto=format&fit=crop', location: 'Mylapore, Chennai', bestTime: 'All Year', occasions: 'Gothic Architecture', budget: '₹500 - ₹2k' }
    ],
    museums: [
        { id: 'govt-museum', name: 'Government Museum (Egmore)', tag: 'Bronzes & Natural History', image: '/where-to-go/govtmuseum.jpg', location: 'Chennai', bestTime: 'Any Day', occasions: 'Chola Bronzes & Amaravati', budget: '₹200 - ₹500' },
        { id: 'dakshinachitra', name: 'DakshinaChitra Heritage Village', tag: 'Living South Indian Culture', image: '/where-to-go/culture.jpg', location: 'ECR, Chennai', bestTime: 'Winter', occasions: 'Folk Crafts & Workshops', budget: '₹500 - ₹1.5k' },
        { id: 'gandhi-museum', name: 'Gandhi Memorial Museum', tag: 'Freedom Movement Artifacts', image: '/where-to-go/gandhi_musueum.jpg', location: 'Madurai', bestTime: 'Any Day', occasions: 'Rani Mangammal Palace', budget: '₹100 - ₹300' },
        { id: 'rail-museum', name: 'Chennai Rail Museum', tag: 'Vintage Steam Locomotives', image: '/where-to-go/rail museuem.jpg', location: 'Villivakkam, Chennai', bestTime: 'Family Day Out', occasions: 'Toy Train Ride & Exhibits', budget: '₹200 - ₹500' },
        { id: 'saraswathi-mahal', name: 'Saraswathi Mahal Library', tag: 'Ancient Palm Leaf Manuscripts', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=800&auto=format&fit=crop', location: 'Thanjavur', bestTime: 'All Year', occasions: 'Medieval Royal Archives', budget: '₹100 - ₹300' },
        { id: 'gedee-car-museum', name: 'Gedee Car Museum', tag: 'World Vintage Automobiles', image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800&auto=format&fit=crop', location: 'Coimbatore', bestTime: 'Any Day', occasions: 'Rare Classic Cars', budget: '₹200 - ₹600' },
        { id: 'keezhadi-museum', name: 'Keezhadi Excavation Museum', tag: '2600-Year Sangam Era Artifacts', image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=800&auto=format&fit=crop', location: 'Sivagangai / Madurai', bestTime: 'All Year', occasions: 'Vaigai Civilization Discovery', budget: '₹100 - ₹300' },
        { id: 'gass-forest-museum', name: 'Gass Forest Museum', tag: 'Forestry & Wildlife Taxonomy', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop', location: 'Coimbatore', bestTime: 'Any Day', occasions: 'Fossil Trunks & Preserved Fauna', budget: '₹100 - ₹250' },
        { id: 'vivekananda-house', name: 'Vivekananda House & Experience', tag: 'Illuminating Heritage Museum', image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=800&auto=format&fit=crop', location: 'Marina, Chennai', bestTime: 'Evening', occasions: 'Interactive AR & VR Exhibits', budget: '₹50 - ₹200' }
    ],
    dams: [
        { id: 'mettur-dam', name: 'Mettur Dam', tag: 'Stanley Reservoir', image: '/where-to-go/mettur.jpg', location: 'Salem', bestTime: 'Monsoon', occasions: 'Hydro Wonder & Park', budget: '₹1k - ₹3k' },
        { id: 'vaigai-dam', name: 'Vaigai Dam', tag: 'Lifeline of Madurai', image: '/where-to-go/vaigai.jpg', location: 'Theni', bestTime: 'Winter', occasions: 'Scenic Gardens & Walkways', budget: '₹1k - ₹3k' },
        { id: 'kallanai', name: 'Kallanai (Grand Anicut)', tag: '2000-Year Chola Engineering', image: '/where-to-go/kalanai.jpg', location: 'Trichy', bestTime: 'Monsoon', occasions: 'Ancient Stone Weir', budget: '₹1k - ₹2k' },
        { id: 'aliyar-dam', name: 'Aliyar Dam & Park', tag: 'Anamalai Foothill Lake', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', location: 'Pollachi', bestTime: 'Oct - March', occasions: 'Boating & Aquarium Park', budget: '₹1.5k - ₹4k' },
        { id: 'bhavanisagar-dam', name: 'Bhavanisagar Dam', tag: 'World\'s Largest Earthen Dam', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop', location: 'Erode', bestTime: 'Sept - Feb', occasions: 'Vast Waterbody Views', budget: '₹1.5k - ₹3.5k' },
        { id: 'sholayar-dam', name: 'Upper Sholayar Dam', tag: 'Misty High-Altitude Reservoir', image: '/where-to-go/valparai.jpg', location: 'Valparai', bestTime: 'Oct - May', occasions: 'Tea Garden Surroundings', budget: '₹2k - ₹6k' },
        { id: 'sathanur-dam', name: 'Sathanur Dam', tag: 'Crocodile Park & Gardens', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', location: 'Tiruvannamalai', bestTime: 'Oct - Feb', occasions: 'Thenpennai River Views', budget: '₹1k - ₹3k' },
        { id: 'papanasam-dam', name: 'Papanasam Dam & Agasthiyar Falls', tag: 'Tamirabarani Origin Waters', image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop', location: 'Tirunelveli', bestTime: 'Nov - Feb', occasions: 'Forest Falls & Reservoir', budget: '₹1.5k - ₹4k' }
    ],
    wildlife: [
        { id: 'mudumalai-res', name: 'Mudumalai Tiger Reserve', tag: 'Nilgiri Biosphere Core', image: '/where-to-go/mudhumalai.jpg', location: 'Nilgiris', bestTime: 'Oct - May', occasions: 'Jungle Safari & Elephants', budget: '₹5k - ₹12k+' },
        { id: 'vedanthangal', name: 'Vedanthangal Bird Sanctuary', tag: '40,000+ Migratory Birds', image: '/where-to-go/vedanthangal.jpg', location: 'Chengalpattu', bestTime: 'Nov - Feb', occasions: 'Bird Watching & Photography', budget: '₹500 - ₹2k' },
        { id: 'anamalai-wild', name: 'Anamalai Tiger Reserve', tag: 'Rainforest & Lion-Tailed Macaques', image: '/where-to-go/anaimalai.jpg', location: 'Pollachi / Valparai', bestTime: 'Winter', occasions: 'Topslip Forest Safari', budget: '₹6k - ₹15k+' },
        { id: 'pichavaram-forest', name: 'Pichavaram Mangrove Forest', tag: 'World\'s 2nd Largest Mangroves', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', location: 'Chidambaram', bestTime: 'Nov - Feb', occasions: 'Boat Safari in Waterways', budget: '₹1.5k - ₹4k' },
        { id: 'gulf-of-mannar', name: 'Gulf of Mannar Marine Biosphere', tag: 'Corals & Dugongs Reserve', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop', location: 'Rameswaram / Mandapam', bestTime: 'Oct - April', occasions: 'Glass-Bottom Boats & Corals', budget: '₹3k - ₹8k' },
        { id: 'kalakkad-wildlife', name: 'Kalakkad Mundanthurai (KMTR)', tag: 'Shola Tiger Sanctuary', image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop', location: 'Tirunelveli', bestTime: 'Nov - March', occasions: 'Trekking & Wildlife Spottings', budget: '₹3k - ₹7k' },
        { id: 'point-calimere', name: 'Point Calimere (Kodiakkarai)', tag: 'Blackbucks & Flamingos', image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=800&auto=format&fit=crop', location: 'Nagapattinam', bestTime: 'Nov - Jan', occasions: 'Coastal Wilderness Safari', budget: '₹2k - ₹5k' },
        { id: 'guindy-park', name: 'Guindy National Park', tag: 'Urban Protected Forest', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800&auto=format&fit=crop', location: 'Chennai City', bestTime: 'All Year', occasions: 'Blackbucks & Nature Walk', budget: '₹100 - ₹400' }
    ],
    adventure: [
        { id: 'yelagiri-para', name: 'Yelagiri Paragliding & Treks', tag: 'Tandem Flights & Cliffs', image: '/where-to-go/yelagiri.jpg', location: 'Tirupattur', bestTime: 'Feb - March', occasions: 'Paragliding & Swamimalai', budget: '₹5k - ₹12k' },
        { id: 'kolukkumalai', name: 'Kolukkumalai Offroad Jeep Safari', tag: '4x4 Trail to the Clouds', image: '/where-to-go/kolukumalai.jpg', location: 'Theni Border', bestTime: 'Oct - May', occasions: 'Sunrise Peak & High Tea', budget: '₹3k - ₹8k' },
        { id: 'rameswaram-scuba', name: 'Rameswaram Scuba & Kayaking', tag: 'Reef Diving & Watersports', image: '/where-to-go/rameshawaram.jpg', location: 'Rameswaram', bestTime: 'Summer & Winter', occasions: 'Underwater Marine Safari', budget: '₹6k - ₹15k' },
        { id: 'hogenakkal-coracle', name: 'Hogenakkal Coracle Rapids', tag: 'Niagara of South India', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', location: 'Dharmapuri', bestTime: 'Aug - Jan', occasions: 'Canyon Coracle Rides & Falls', budget: '₹2k - ₹6k' },
        { id: 'vattakanal-dolphins', name: 'Dolphin\'s Nose & Vattakanal', tag: 'Cliff Edge Trekking', image: '/where-to-go/kodaikanal.jpg', location: 'Kodaikanal', bestTime: 'Oct - May', occasions: '6600ft Chasm Lookout', budget: '₹3k - ₹7k' },
        { id: 'kovalam-surfing', name: 'Kovalam Surf School & SUP', tag: 'Catching Arabian Waves', image: '/where-to-go/kovlam beach.webp', location: 'ECR, Chennai', bestTime: 'All Year', occasions: 'Professional Surfing & Paddle', budget: '₹2k - ₹6k' },
        { id: 'agaya-gangai-trek', name: 'Agaya Gangai 1300-Step Gorge', tag: 'Thundering Gorge Descent', image: '/where-to-go/kolli-hills.jpg', location: 'Kolli Hills', bestTime: 'Sept - Feb', occasions: 'Extreme Step Trek & Falls', budget: '₹1.5k - ₹4k' },
        { id: 'kurangani-top-station', name: 'Kurangani to Top Station Trek', tag: 'Classic Western Ghats Trail', image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=800&auto=format&fit=crop', location: 'Theni', bestTime: 'Oct - Feb', occasions: 'High Altitude Cloud Walk', budget: '₹2k - ₹5k' }
    ],
    food: [
        { id: 'dindigul-bir', name: 'Dindigul Biryani', tag: 'Legendary Style', image: '/where-to-go/briyani.jpg', location: 'Dindigul', bestTime: 'All Year', occasions: 'Foodies', budget: '₹300 - ₹1k' },
        { id: 'madurai-jig', name: 'Jigarthanda', tag: 'Madurai Special', image: '/where-to-go/jigarthanda.jpg', location: 'Madurai', bestTime: 'Summer', occasions: 'Refreshing', budget: '₹100 - ₹500' },
        { id: 'filter-coffee', name: 'Filter Coffee', tag: 'Kumbakonam Fav', image: '/where-to-go/cofeee.jpg', location: 'TN Homes', bestTime: 'Morning', occasions: 'Daily Energy', budget: '₹50 - ₹150' }
    ],
    culture: [
        { id: 'pongal-fest', name: 'Pongal', tag: 'Traditional', image: '/where-to-go/pongal.jpg', location: 'Villages', bestTime: 'Jan 14-17', occasions: 'Harvest', budget: 'N/A' },
        { id: 'jallikattu', name: 'Jallikattu', tag: 'Brave Sport', image: '/where-to-go/jallikatu.jpg', location: 'Alanganallur', bestTime: 'January', occasions: 'Courage', budget: 'N/A' },
        { id: 'bharatanatyam', name: 'Classical Dance', tag: 'Divine Art', image: '/where-to-go/bharathanattiyam.jpg', location: 'Chidambaram', bestTime: 'March', occasions: 'Tradition', budget: 'N/A' }
    ]
};

const WhereToGo = () => {
    const navigate = useNavigate();
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [activeCategory, setActiveCategory] = useState('hills');
    const [currentIndex, setCurrentIndex] = useState(1);
    const scrollRef = useRef(null);
    const resultsRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);

        const handleScroll = () => {
            if (scrollRef.current) {
                const scrollLeft = scrollRef.current.scrollLeft;
                const cardWidth = 285; // Card width + gap
                const index = Math.round(scrollLeft / cardWidth) + 1;
                setCurrentIndex(Math.min(Math.max(index, 1), 10));
            }
        };

        const slider = scrollRef.current;
        if (slider) {
            slider.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (slider) slider.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleCategoryClick = (catId) => {
        setActiveCategory(catId);
        if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handlePlanTrip = (placeName) => {
        navigate('/plan-trip', { state: { destination: placeName } });
    };

    const handleNext = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    return (
        <div className="where-to-go-redesign">
            <Navbar />

            {/* Fullscreen Hero Section */}
            <section className="wtg-hero-fullscreen">
                <div className="hero-overlay"></div>

                <div className="wtg-hero-content-wrapper">
                    {/* Left Side: Content */}
                    <div className="hero-left-sidebar">
                        <motion.div
                            initial={{ opacity: 0, x: -60 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="hero-tag">
                                <i className="fa-solid fa-compass" style={{ marginRight: '6px' }}></i> TAMIL NADU EXPLORER
                            </span>
                            <h1>DISCOVER THE <br /> WONDERS OF <br /> TAMIL NADU.</h1>
                            <p>From misty hill stations and ancient temples to untouched coasts and wild rainforests. Find your next adventure.</p>
                            <button
                                className="hero-cta-btn"
                                onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            >
                                EXPLORE DESTINATIONS <i className="fa-solid fa-arrow-down" style={{ marginLeft: '8px' }}></i>
                            </button>
                        </motion.div>
                    </div>

                    {/* Right Side: Embedded Horizontal Slider */}
                    <div className="hero-right-slider">
                        <div className="slider-container" ref={scrollRef}>
                            <div className="slider-track">
                                {categories.map((cat, index) => (
                                    <motion.div
                                        key={cat.id}
                                        className={`cat-card-item ${activeCategory === cat.id ? 'active' : ''}`}
                                        whileHover={{ y: -10, scale: 1.03 }}
                                        onClick={() => handleCategoryClick(cat.id)}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="cat-card-inner">
                                            <img
                                                src={cat.img}
                                                alt={cat.name}
                                                crossOrigin="anonymous"
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop';
                                                }}
                                            />
                                            <div className="cat-card-overlay">
                                                <span className="cat-emoji">{cat.emoji}</span>
                                                <h3>{cat.name}</h3>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="slider-controls">
                            <button className="ctrl-btn prev" onClick={handlePrev} aria-label="Previous Category">
                                <i className="fa-solid fa-arrow-left"></i>
                            </button>
                            <div className="slider-line">
                                <div className="line-progress" style={{ width: `${(currentIndex / 10) * 100}%` }}></div>
                            </div>
                            <button className="ctrl-btn next" onClick={handleNext} aria-label="Next Category">
                                <i className="fa-solid fa-arrow-right"></i>
                            </button>
                            <span className="slider-count">{currentIndex.toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Category Results Section */}
            <main className="wtg-main-exploration" ref={resultsRef} id="destinations-grid">
                <AnimatePresence mode="wait">
                    {activeCategory && (
                        <motion.section
                            key={activeCategory}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="category-detail-section"
                        >
                            {(() => {
                                const cat = categories.find(c => c.id === activeCategory) || categories[0];
                                const placesList = placesData[activeCategory] || [];
                                return (
                                    <>
                                        <div className="section-header-flat">
                                            <div className="header-badge-row">
                                                <span className="cat-badge-main">{cat.emoji} {cat.name}</span>
                                                <span className="cat-count-badge">{placesList.length} Places Found</span>
                                            </div>
                                            <h2>{cat.title}</h2>
                                            <p>Explore curated, popular, and offbeat destinations across {cat.name} in Tamil Nadu.</p>
                                        </div>

                                        <div className="places-grid-premium">
                                            {placesList.map((place) => (
                                                <div key={place.id} className="premium-place-card" onClick={() => setSelectedPlace(place)}>
                                                    <div className="card-top">
                                                        <img
                                                            src={place.image}
                                                            alt={place.name}
                                                            onError={(e) => {
                                                                e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop';
                                                            }}
                                                        />
                                                        <span className="p-tag">{place.tag}</span>
                                                        <span className="p-location-tag">
                                                            <i className="fa-solid fa-location-dot"></i> {place.location}
                                                        </span>
                                                    </div>
                                                    <div className="card-bottom">
                                                        <div>
                                                            <h3>{place.name}</h3>
                                                            <span className="p-budget-hint">{place.budget || 'Affordable'}</span>
                                                        </div>
                                                        <div className="card-arrow-circle">
                                                            <i className="fa-solid fa-arrow-right"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>

            {/* Place Detail Modal */}
            <AnimatePresence>
                {selectedPlace && (
                    <motion.div
                        className="wtg-modal-overlay"
                        onClick={() => setSelectedPlace(null)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="wtg-modal-content premium-styled-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header-main">
                                <div className="header-left">
                                    <i className="fa-solid fa-map-location-dot"></i>
                                    <h2>Destination Details</h2>
                                </div>
                                <button className="close-modal-btn" onClick={() => setSelectedPlace(null)}>&times;</button>
                            </div>

                            <div className="modal-body-scrollable">
                                {/* Top Image Section */}
                                <div className="modal-hero-image">
                                    <img
                                        src={selectedPlace.image}
                                        alt={selectedPlace.name}
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop';
                                        }}
                                    />
                                    <div className="image-info-overlay">
                                        <h1>{selectedPlace.name}</h1>
                                        <span><i className="fa-solid fa-location-dot"></i> {selectedPlace.location || 'Tamil Nadu'}</span>
                                    </div>
                                </div>

                                <div className="modal-grid-sections">
                                    {/* Basic Info Section */}
                                    <div className="modal-info-block">
                                        <h3><i className="fa-solid fa-thumbtack"></i> Basic Info</h3>
                                        <div className="info-fields-grid">
                                            <div className="field-item">
                                                <label>CATEGORY</label>
                                                <p>{categories.find(c => c.id === activeCategory)?.name || 'Destination'}</p>
                                            </div>
                                            <div className="field-item">
                                                <label>BEST TIME TO VISIT</label>
                                                <p>{selectedPlace.bestTime || 'Oct - March'}</p>
                                            </div>
                                            <div className="field-item">
                                                <label>LOCATION</label>
                                                <p>{selectedPlace.location || 'Tamil Nadu'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Travel Specs Section */}
                                    <div className="modal-info-block">
                                        <h3><i className="fa-solid fa-rocket"></i> Travel Specs</h3>
                                        <div className="info-fields-grid">
                                            <div className="field-item">
                                                <label>SPECIAL OCCASION</label>
                                                <p>{selectedPlace.occasions || 'Family / Honeymoon'}</p>
                                            </div>
                                            <div className="field-item">
                                                <label>TRAVEL VIBE</label>
                                                <p>{selectedPlace.tag || 'Relaxing'}</p>
                                            </div>
                                            <div className="field-item">
                                                <label>TRANSPORT MODE</label>
                                                <p>Car / Train / Bus</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Budget Section */}
                                <div className="modal-info-block budget-full-width">
                                    <h3><i className="fa-solid fa-sack-dollar"></i> Estimated Budget Breakdown</h3>
                                    <div className="budget-cards-row">
                                        <div className="budget-mini-card">
                                            <label>MIN BUDGET (₹)</label>
                                            <div className="budget-val">₹{selectedPlace.budget?.split('-')[0]?.replace('₹', '')?.trim() || '2000'}</div>
                                        </div>
                                        <div className="budget-mini-card">
                                            <label>AVG BUDGET (₹)</label>
                                            <div className="budget-val">₹{selectedPlace.budget?.split('-')[1]?.split('+')[0]?.replace('₹', '')?.trim() || '8000'}</div>
                                        </div>
                                        <div className="budget-mini-card">
                                            <label>LUXURY (₹)</label>
                                            <div className="budget-val">₹15,000+</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Map Section */}
                                <div className="modal-info-block map-full-width">
                                    <h3><i className="fa-solid fa-map"></i> Interactive Guide Map</h3>
                                    <div className="map-embed-container">
                                        <iframe
                                            title="Destination Map"
                                            width="100%"
                                            height="350"
                                            frameBorder="0"
                                            style={{ border: 0, borderRadius: '15px' }}
                                            src={`https://www.google.com/maps?q=${encodeURIComponent(selectedPlace.name + ', ' + (selectedPlace.location || 'Tamil Nadu'))}&output=embed`}
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer-actions">
                                <button className="modal-action-btn cancel" onClick={() => setSelectedPlace(null)}>Close</button>
                                <button className="modal-action-btn primary" onClick={() => handlePlanTrip(selectedPlace.name)}>Plan This Trip</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
};

export default WhereToGo;
