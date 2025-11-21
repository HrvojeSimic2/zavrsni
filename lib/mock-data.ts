export interface Tour {
  id: string
  title: string
  description: string
  category: 'food' | 'nature' | 'culture' | 'adventure' | 'history'
  location: string
  country: string
  price: number
  duration: string
  rating: number
  reviewCount: number
  image: string
  guide: {
    name: string
    avatar: string
    languages: string[]
    verified: boolean
  }
  groupSize: string
  highlights: string[]
}

export interface Review {
  id: string
  author: string
  avatar: string
  rating: number
  date: string
  comment: string
  helpful: number
}

export const mockReviews: { [key: string]: Review[] } = {
  '1': [
    {
      id: 'r1',
      author: 'Sarah Johnson',
      avatar: '/placeholder.svg?key=sa23x',
      rating: 5,
      date: '2025-01-15',
      comment: 'Absolutely incredible experience! Somchai took us to places I never would have found on my own. The food was outstanding and the stories he shared about each location made it so special.',
      helpful: 24,
    },
    {
      id: 'r2',
      author: 'Michael Chen',
      avatar: '/placeholder.svg?key=h8jko',
      rating: 5,
      date: '2025-01-10',
      comment: 'Best food tour I\'ve ever been on. Every stop was a hidden gem with authentic local flavors. Somchai is incredibly knowledgeable and passionate about his city.',
      helpful: 18,
    },
    {
      id: 'r3',
      author: 'Emma Rodriguez',
      avatar: '/placeholder.svg?key=ld902',
      rating: 4,
      date: '2025-01-05',
      comment: 'Great tour with amazing food! Only wish it was a bit longer because I wanted to see more. Highly recommend for food lovers.',
      helpful: 12,
    },
  ],
  // Add reviews for other tours as needed
}

export const mockTours: Tour[] = [
  {
    id: '1',
    title: 'Hidden Street Food Adventure',
    description: 'Discover authentic local cuisine in hidden alleyways and family-run eateries that tourists never find.',
    category: 'food',
    location: 'Bangkok',
    country: 'Thailand',
    price: 45,
    duration: '3 hours',
    rating: 4.9,
    reviewCount: 127,
    image: '/bangkok-street-food-market.jpg',
    guide: {
      name: 'Somchai Patel',
      avatar: '/thai-man-portrait.png',
      languages: ['English', 'Thai'],
      verified: true,
    },
    groupSize: 'Max 6 people',
    highlights: ['10+ food tastings', 'Local market visit', 'Secret spots', 'Vegetarian options'],
  },
  {
    id: '2',
    title: 'Secret Waterfalls & Swimming Holes',
    description: 'Hike to pristine waterfalls and natural pools known only to locals, away from crowded tourist spots.',
    category: 'nature',
    location: 'Ubud',
    country: 'Indonesia',
    price: 55,
    duration: '5 hours',
    rating: 5.0,
    reviewCount: 89,
    image: '/hidden-waterfall-bali.jpg',
    guide: {
      name: 'Made Wirawan',
      avatar: '/balinese-man-portrait.jpg',
      languages: ['English', 'Indonesian', 'Balinese'],
      verified: true,
    },
    groupSize: 'Max 8 people',
    highlights: ['3 hidden waterfalls', 'Swimming time', 'Jungle trekking', 'Local lunch'],
  },
  {
    id: '3',
    title: 'Underground Jazz Scene Tour',
    description: 'Experience the authentic jazz culture in hidden basement clubs and speakeasy bars with live performances.',
    category: 'culture',
    location: 'New Orleans',
    country: 'USA',
    price: 65,
    duration: '4 hours',
    rating: 4.8,
    reviewCount: 156,
    image: '/jazz-club-interior.jpg',
    guide: {
      name: 'Marcus Washington',
      avatar: '/jazz-musician-portrait.jpg',
      languages: ['English'],
      verified: true,
    },
    groupSize: 'Max 10 people',
    highlights: ['3 jazz venues', 'Live performances', 'Meet musicians', 'Drink included'],
  },
  {
    id: '4',
    title: 'Ancient Village Sunrise Trek',
    description: 'Wake before dawn to hike through mountain paths to a 500-year-old village with breathtaking views.',
    category: 'adventure',
    location: 'Sapa',
    country: 'Vietnam',
    price: 40,
    duration: '6 hours',
    rating: 4.9,
    reviewCount: 94,
    image: '/vietnam-mountain-village-sunrise.jpg',
    guide: {
      name: 'Linh Nguyen',
      avatar: '/vietnamese-woman-portrait.png',
      languages: ['English', 'Vietnamese', 'Hmong'],
      verified: true,
    },
    groupSize: 'Max 6 people',
    highlights: ['Sunrise views', 'Traditional village', 'Local breakfast', 'Photo opportunities'],
  },
  {
    id: '5',
    title: 'Artisan Workshop Crawl',
    description: 'Visit traditional craftspeople in their workshops - potters, weavers, and blacksmiths keeping old traditions alive.',
    category: 'culture',
    location: 'Fez',
    country: 'Morocco',
    price: 50,
    duration: '4 hours',
    rating: 4.7,
    reviewCount: 73,
    image: '/moroccan-artisan-workshop.jpg',
    guide: {
      name: 'Fatima El Amrani',
      avatar: '/moroccan-woman-portrait.png',
      languages: ['English', 'Arabic', 'French'],
      verified: true,
    },
    groupSize: 'Max 5 people',
    highlights: ['5 workshops', 'Hands-on experience', 'Tea with artisans', 'Support local crafts'],
  },
  {
    id: '6',
    title: 'Coastal Foraging & Cooking',
    description: 'Learn to forage for sea vegetables and shellfish, then cook a meal using traditional coastal recipes.',
    category: 'food',
    location: 'Galway',
    country: 'Ireland',
    price: 70,
    duration: '5 hours',
    rating: 5.0,
    reviewCount: 61,
    image: '/irish-coastal-foraging.jpg',
    guide: {
      name: 'Siobhan Murphy',
      avatar: '/irish-woman-portrait.jpg',
      languages: ['English', 'Irish'],
      verified: true,
    },
    groupSize: 'Max 8 people',
    highlights: ['Foraging experience', 'Cooking class', 'Beach walk', 'Full meal included'],
  },
  {
    id: '7',
    title: 'Urban Murals & Street Art Stories',
    description: 'Explore hidden street art with an artist who knows the stories behind every mural and the community they represent.',
    category: 'culture',
    location: 'Valparaíso',
    country: 'Chile',
    price: 35,
    duration: '3 hours',
    rating: 4.8,
    reviewCount: 112,
    image: '/valparaiso-street-art-murals.jpg',
    guide: {
      name: 'Diego Rojas',
      avatar: '/chilean-artist-portrait.jpg',
      languages: ['English', 'Spanish'],
      verified: true,
    },
    groupSize: 'Max 12 people',
    highlights: ['15+ murals', 'Meet local artists', 'Hidden viewpoints', 'Art history'],
  },
  {
    id: '8',
    title: 'Forgotten Temples Exploration',
    description: 'Discover lesser-known temples hidden in the jungle, learn their histories and participate in a local ceremony.',
    category: 'history',
    location: 'Siem Reap',
    country: 'Cambodia',
    price: 60,
    duration: '7 hours',
    rating: 4.9,
    reviewCount: 145,
    image: '/hidden-cambodian-temple-jungle.jpg',
    guide: {
      name: 'Sokha Chan',
      avatar: '/cambodian-man-portrait.jpg',
      languages: ['English', 'Khmer', 'French'],
      verified: true,
    },
    groupSize: 'Max 6 people',
    highlights: ['4 hidden temples', 'Blessing ceremony', 'Lunch included', 'Avoid crowds'],
  },
]
