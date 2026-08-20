/**
 * Cultural Events Data for Tamil Nadu
 * Organized by month (0 = January, 11 = December)
 */
export const getCulturalEvents = (t) => [
    // January (Thai)
    {
        id: 101,
        monthIndex: 0,
        day: '14-17',
        monthLabel: 'JAN',
        tamilMonth: 'தை (Thai)',
        title: t('events.pongal.title', 'Pongal & Jallikattu Festival'),
        desc: t('events.pongal.desc', 'The grand harvest festival of gratitude to Nature, Sun, and Cattle.'),
        longDesc: t('events.pongal.longDesc', 'Pongal is a four-day harvest festival celebrated by Tamil people globally, dedicated to the Sun God Surya. It features cooking the fresh rice harvest in clay pots, colorful decorations, and the traditional bull-taming sport of Jallikattu in Alanganallur.'),
        img: '/pongal_festival_tn_1767338347356.webp',
        color: '#ff4e00'
    },
    // February (Maasi)
    {
        id: 201,
        monthIndex: 1,
        day: '02',
        monthLabel: 'FEB',
        tamilMonth: 'மாசி (Maasi)',
        title: t('events.thaipusam.title', 'Thaipusam Festival'),
        desc: t('events.thaipusam.desc', 'A grand festival of devotion and penance dedicated to Lord Murugan.'),
        longDesc: t('events.thaipusam.longDesc', 'Thaipusam is a spectacular Hindu festival celebrated on the full moon in the Tamil month of Thai. Devotees perform acts of devotion like carrying "Kavadis" and body piercings with spears, walking barefoot for miles to Murugan temples like Palani and Vadapalani.'),
        img: '/thaipusam_festival_tn_1767338364844.webp',
        color: '#ffc107'
    },
    // March (Panguni)
    {
        id: 301,
        monthIndex: 2,
        day: '01-05',
        monthLabel: 'MAR',
        tamilMonth: 'பங்குனி (Panguni)',
        title: t('events.natyanjali.title', 'Natyanjali Dance Festival'),
        desc: t('events.natyanjali.desc', 'A divine tribute of classical dance to Lord Nataraja in Chidambaram.'),
        longDesc: t('events.natyanjali.longDesc', 'Natyanjali is an annual classical dance festival beginning on the auspicious day of Maha Shivaratri. Prominent dancers from all over India gather at the Chidambaram Nataraja Temple to perform Bharatanatyam and offer their art to the Lord of Dance.'),
        img: '/natyanjali_dance_tn_1767338382242.webp',
        color: '#9c27b0'
    },
    // April (Chithirai)
    {
        id: 401,
        monthIndex: 3,
        day: '14',
        monthLabel: 'APR',
        tamilMonth: 'சித்திரை (Chithirai)',
        title: t('events.puthandu.title', 'Puthandu (Tamil New Year)'),
        desc: t('events.puthandu.desc', 'The auspicious first day of the Tamil calendar marked by colorful feasts.'),
        longDesc: t('events.puthandu.longDesc', 'Puthandu marks the Tamil New Year. Families decorate their homes with colorful Kolams, arrange a tray of auspicious items (Kani) containing gold, fruits, and flowers, and prepare the traditional "Mango Pachadi" which combines six distinct tastes representing life\'s varied experiences.'),
        img: '/tn verse/src/tn-temple.png',
        color: '#4caf50'
    },
    {
        id: 402,
        monthIndex: 3,
        day: '28',
        monthLabel: 'APR',
        tamilMonth: 'சித்திரை (Chithirai)',
        title: t('events.chithirai.title', 'Chithirai Thiruvizha (Madurai)'),
        desc: t('events.chithirai.desc', 'The legendary celestial wedding of Goddess Meenakshi in Madurai.'),
        longDesc: t('events.chithirai.longDesc', 'Chithirai Thiruvizha is a grand month-long festival in Madurai, depicting the celestial wedding of Goddess Meenakshi to Lord Sundareswarar. The highlight is the golden chariot procession and Lord Alagar\'s entry into the Vaigai River riding a golden horse.'),
        img: '/chithirai_thiruvizha_tn_1767338402401.webp',
        color: '#f44336'
    },
    // May (Vaikasi)
    {
        id: 501,
        monthIndex: 4,
        day: '15-20',
        monthLabel: 'MAY',
        tamilMonth: 'வைகாசி (Vaikasi)',
        title: t('events.ooty_flower.title', 'Ooty Summer & Flower Show'),
        desc: t('events.ooty_flower.desc', 'A premium, colorful exhibition of rare flowers in the Nilgiri hills.'),
        longDesc: t('events.ooty_flower.longDesc', 'Held annually in the Government Botanical Garden of Ooty, this summer festival showcases breathtaking flower arrangements, floral replicas, and plant exhibitions, attracting lakhs of nature lovers and tourists to the cool Nilgiri hills.'),
        img: '/ooty_flower_show.png',
        color: '#e91e63'
    },
    // June (Aani)
    {
        id: 601,
        monthIndex: 5,
        day: '12-18',
        monthLabel: 'JUN',
        tamilMonth: 'ஆனி (Aani)',
        title: t('events.mango_festival.title', 'Krishnagiri Mango Festival'),
        desc: t('events.mango_festival.desc', 'A vibrant celebration showcasing hundreds of varieties of mangoes.'),
        longDesc: t('events.mango_festival.longDesc', 'Krishnagiri is the mango capital of Tamil Nadu. The annual Mango Exhibition showcases over 100 varieties of mangoes grown in the region, featuring massive fruit arrangements, agricultural seminars, and delicious tastings of fresh mangoes.'),
        img: '/mango_festival.png',
        color: '#ffc107'
    },
    // July (Aadi)
    {
        id: 701,
        monthIndex: 6,
        day: '03',
        monthLabel: 'JUL',
        tamilMonth: 'ஆடி (Aadi)',
        title: t('events.aadi_perukku.title', 'Aadi Perukku (Aadi 18)'),
        desc: t('events.aadi_perukku.desc', 'A unique festival honoring water resources as the source of life.'),
        longDesc: t('events.aadi_perukku.longDesc', 'Aadi Perukku is celebrated on the 18th day of the Tamil month Aadi to pay tribute to the Cauvery River. It marks the onset of monsoon and rising water levels, where families gather on riverbanks to float clay lamps, offer flowers, and enjoy traditional variety rices.'),
        img: '/aadi_perukku.png',
        color: '#00bcd4'
    },
    // August (Avani)
    {
        id: 801,
        monthIndex: 7,
        day: '24',
        monthLabel: 'AUG',
        tamilMonth: 'ஆவணி (Avani)',
        title: t('events.krishna_jayanthi.title', 'Sri Krishna Jayanthi'),
        desc: t('events.krishna_jayanthi.desc', 'Celebrating Lord Krishna\'s birth with sweet offerings and Uriadi.'),
        longDesc: t('events.krishna_jayanthi.longDesc', 'Gokulashtami celebrates the birth of Lord Krishna. Homes are decorated with tiny footprints drawn with rice flour paste representing baby Krishna entering the house. Traditional sweets like seedai are prepared, and youths participate in Uriadi (breaking suspended clay pots of butter).'),
        img: '/krishna_jayanthi.png',
        color: '#3f51b5'
    },
    // September (Purattasi)
    {
        id: 901,
        monthIndex: 8,
        day: '17',
        monthLabel: 'SEP',
        tamilMonth: 'புரட்டாசி (Purattasi)',
        title: t('events.vinayagar.title', 'Vinayagar Chaturthi'),
        desc: t('events.vinayagar.desc', 'Celebrating Ganesha\'s birth with clay idols and sweet Kozhukattai.'),
        longDesc: t('events.vinayagar.longDesc', 'Vinayagar Chaturthi is celebrated grandly across Tamil Nadu. Families install beautifully crafted eco-friendly clay idols of Lord Ganesha at home, decorating them with flowers and offering delicious sweet dumplings (Kozhukattai). The festival ends with clay idol immersion processions.'),
        img: '/vinayagar_chaturthi.png',
        color: '#ff9800'
    },
    // October (Aippasi)
    {
        id: 1001,
        monthIndex: 9,
        day: '29',
        monthLabel: 'OCT',
        tamilMonth: 'ஐப்பசி (Aippasi)',
        title: t('events.deepavali.title', 'Deepavali (Festival of Lights)'),
        desc: t('events.deepavali.desc', 'The grand festival of lights marked by oil baths, sweets, and crackers.'),
        longDesc: t('events.deepavali.longDesc', 'Deepavali in Tamil Nadu begins before dawn with a traditional sesame oil bath (Ganga Snanam), representing purification. Devotees wear new clothes, burst fireworks and sparklers, share homemade sweets like Mysore Pak and Adhirasam, and visit temples.'),
        img: '/deepavali.png',
        color: '#ff5722'
    },
    // November (Karthigai)
    {
        id: 1101,
        monthIndex: 10,
        day: '25',
        monthLabel: 'NOV',
        tamilMonth: 'கார்த்திகை (Karthigai)',
        title: t('events.karthigai_deepam.title', 'Karthigai Deepam'),
        desc: t('events.karthigai_deepam.desc', 'Ancient festival of lights featuring the giant beacon of Tiruvannamalai.'),
        longDesc: t('events.karthigai_deepam.longDesc', 'Karthigai Deepam is one of the oldest festivals of Tamil Nadu. In Tiruvannamalai, a massive flame (Mahadeepam) is lit on top of the holy Arunachala hill. Homes across the state are decorated with rows of beautiful clay oil lamps (Agal vilakkus) in the evening.'),
        img: '/karthigai_deepam.png',
        color: '#ff9800'
    },
    // December (Margazhi)
    {
        id: 1201,
        monthIndex: 11,
        day: '15-31',
        monthLabel: 'DEC',
        tamilMonth: 'மார்கழி (Margazhi)',
        title: t('events.margazhi.title', 'Margazhi Music & Dance Festival'),
        desc: t('events.margazhi.desc', 'A world-famous, month-long celebration of Carnatic music and dance.'),
        longDesc: t('events.margazhi.longDesc', 'The Margazhi festival, or Chennai Music Season, is one of the world\'s largest cultural events. Music academies (Sabhas) across Chennai host thousands of concerts featuring traditional Carnatic music performances, devotional songs, and classical Bharatanatyam dance recitals.'),
        img: '/margazhi_music_tn_1767338428632.webp',
        color: '#2196f3'
    }
];

export const getMonthList = (t) => [
    { name: t('months.jan', 'Jan'), tamil: 'தை (Thai)' },
    { name: t('months.feb', 'Feb'), tamil: 'மாசி (Maasi)' },
    { name: t('months.mar', 'Mar'), tamil: 'பங்குனி (Panguni)' },
    { name: t('months.apr', 'Apr'), tamil: 'சித்திரை (Chithirai)' },
    { name: t('months.may', 'May'), tamil: 'வைகாசி (Vaikasi)' },
    { name: t('months.jun', 'Jun'), tamil: 'ஆனி (Aani)' },
    { name: t('months.jul', 'Jul'), tamil: 'ஆடி (Aadi)' },
    { name: t('months.aug', 'Aug'), tamil: 'ஆவணி (Avani)' },
    { name: t('months.sep', 'Sep'), tamil: 'புரட்டாசி (Purattasi)' },
    { name: t('months.oct', 'Oct'), tamil: 'ஐப்பசி (Aippasi)' },
    { name: t('months.nov', 'Nov'), tamil: 'கார்த்திகை (Karthigai)' },
    { name: t('months.dec', 'Dec'), tamil: 'மார்கழி (Margazhi)' }
];
