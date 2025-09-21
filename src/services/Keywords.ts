// Simplified keywords for query enhancement and semantic search

// Core ambiance keywords for location search
export const AMBIANCE_KEYWORDS = [
  "cozy",
  "intimate",
  "romantic",
  "quiet",
  "peaceful",
  "calm",
  "lively",
  "energetic",
  "vibrant",
  "bustling",
  "crowded",
  "busy",
  "trendy",
  "hip",
  "modern",
  "traditional",
  "classic",
  "outdoor",
  "patio",
  "rooftop",
  "garden",
  "terrace",
  "dim",
  "bright",
  "warm",
  "cool",
  "ambient",
  "atmospheric",
];

// Time and occasion keywords
export const TIME_PATTERNS = [
  "morning",
  "afternoon",
  "evening",
  "night",
  "dawn",
  "dusk",
  "breakfast",
  "lunch",
  "dinner",
  "brunch",
  "happy hour",
];

export const OCCASION_KEYWORDS = [
  "business",
  "meeting",
  "work",
  "professional",
  "date",
  "romantic",
  "anniversary",
  "valentine",
  "family",
  "kids",
  "children",
  "group",
  "friends",
  "solo",
  "alone",
  "personal",
  "leisure",
  "vacation",
];

// Weather and seasonal keywords
export const WEATHER_KEYWORDS = [
  "sunny",
  "rainy",
  "cloudy",
  "snowy",
  "hot",
  "cold",
  "warm",
  "cool",
];

export const SEASON_KEYWORDS = ["spring", "summer", "fall", "autumn", "winter"];

// Group size and budget keywords
export const GROUP_SIZE_KEYWORDS = [
  "solo",
  "alone",
  "couple",
  "group",
  "family",
  "friends",
  "team",
  "party",
];

export const BUDGET_KEYWORDS = [
  "cheap",
  "budget",
  "affordable",
  "expensive",
  "luxury",
  "high-end",
  "mid-range",
];

// Ambiance mapping for query expansion
export const AMBIANCE_MAP: { [key: string]: string[] } = {
  cozy: ["cozy", "warm", "intimate", "comfortable", "relaxing"],
  cafe: ["coffee", "cafe", "coffeeshop", "coffeehouse", "espresso"],
  quiet: ["quiet", "peaceful", "serene", "calm", "tranquil"],
  lively: ["lively", "energetic", "vibrant", "bustling", "active"],
  romantic: ["romantic", "intimate", "cozy", "candlelit", "date"],
  work: ["work", "laptop", "wifi", "quiet", "productive"],
  study: ["study", "quiet", "focused", "academic", "library-like"],
};

// Location patterns for extraction
export const LOCATION_PATTERNS = [
  // Pattern 1: "trip: washington dc jun 25 - 27" -> extract just "washington dc"
  /trip:\s*(washington\s+dc|san\s+francisco|new\s+york|los\s+angeles|chicago|boston|seattle|miami|denver)/gi,
  // Pattern 2: "washington dc", "san francisco", etc. (standalone)
  /(?:washington\s+dc|san\s+francisco|new\s+york|los\s+angeles|chicago|boston|seattle|miami|denver)/gi,
  // Pattern 3: "dc", "sf", "nyc", etc.
  /(?:dc|sf|nyc|la|chi|boston|seattle|miami|denver)/gi,
];

// Location mapping for abbreviations
export const LOCATION_MAP: { [key: string]: string } = {
  dc: "Washington DC",
  sf: "San Francisco, CA",
  nyc: "New York, NY",
  la: "Los Angeles, CA",
  chi: "Chicago, IL",
  boston: "Boston, MA",
  seattle: "Seattle, WA",
  miami: "Miami, FL",
  denver: "Denver, CO",
};

export const SEARCH_FILTER_KEYWORDS = AMBIANCE_KEYWORDS;
export const DATE_PATTERNS = [
  /\b(today|tomorrow|yesterday|this week|next week|this month|next month)\b/gi,
];

// Combined keyword arrays for easy access
export const ALL_AMBIANCE_KEYWORDS = AMBIANCE_KEYWORDS;
export const ALL_TIME_KEYWORDS = TIME_PATTERNS;
export const ALL_CONTEXT_KEYWORDS = [
  ...OCCASION_KEYWORDS,
  ...WEATHER_KEYWORDS,
  ...SEASON_KEYWORDS,
  ...GROUP_SIZE_KEYWORDS,
  ...BUDGET_KEYWORDS,
];

// Category mapping for Yelp API
export const CATEGORY_MAP: { [key: string]: string } = {
  // Coffee/Cafe terms (all map to "coffee")
  coffee: "coffee",
  cafe: "coffee",
  coffeeshop: "coffee",
  coffeehouse: "coffee",
  espresso: "coffee",
  cappuccino: "coffee",
  latte: "coffee",
  mocha: "coffee",
  americano: "coffee",

  // Restaurant/Food terms
  restaurant: "restaurants",
  food: "restaurants",
  dining: "restaurants",
  meal: "restaurants",
  lunch: "restaurants",
  dinner: "restaurants",
  breakfast: "restaurants",
  brunch: "restaurants",

  // Bar/Drink terms
  bar: "bars",
  pub: "bars",
  brewery: "breweries",
  wine: "wine_bars",
  cocktail: "cocktailbars",
  drinks: "bars",
  alcohol: "bars",

  // Tea & Alternative Beverages
  tea: "tea_rooms",
  teahouse: "tea_rooms",
  matcha: "tea_rooms",
  boba: "bubble_tea",
  bubbletea: "bubble_tea",
  smoothie: "juice_bars",
  juice: "juice_bars",

  // Study/Work Spaces
  study: "study_spaces",
  work: "coworking",
  coworking: "coworking",
  workspace: "coworking",
  library: "libraries",
  quiet: "libraries",

  // Books & Culture
  bookstore: "bookstores",
  books: "bookstores",
  reading: "bookstores",
  record: "music_stores",
  vinyl: "music_stores",
  music: "music_venues",

  // Entertainment & Nightlife
  club: "nightlife",
  nightlife: "nightlife",
  karaoke: "karaoke",
  pool: "billiards", // for pool halls
  arcade: "arcades",
  bowling: "bowling",
  casino: "casinos",

  // Relaxation & Wellness
  massage: "massage",
  wellness: "wellness",
  meditation: "wellness",
  yoga: "yoga",
  pilates: "fitness",

  // Food Specialties
  pizza: "pizza",
  sushi: "sushi",
  ice_cream: "ice_cream",
  icecream: "ice_cream",
  dessert: "desserts",
  bakery: "bakeries",
  pastry: "bakeries",
  deli: "delis",
  sandwich: "delis",

  // Outdoor & Activities
  hiking: "hiking",
  trail: "hiking",
  garden: "gardens",
  botanical: "gardens",
  zoo: "zoos",
  aquarium: "aquariums",
  mini_golf: "mini_golf",
  golf: "golf",

  // Services
  laundry: "laundromats",
  dry_cleaning: "dry_cleaning",
  auto: "auto_services",
  mechanic: "auto_services",
  pet: "pet_services",
  veterinarian: "veterinarians",
  vet: "veterinarians",

  // Transportation
  airport: "airports",
  train: "train_stations",
  subway: "train_stations",
  metro: "train_stations",
  bus: "bus_stations",
  taxi: "transportation",
  uber: "transportation",

  // Ambiance-specific terms
  cozy: "cozy_spaces",
  romantic: "romantic",
  date: "date_spots",
  family: "family_friendly",
  kids: "family_friendly",
  outdoor: "outdoor_dining",
  rooftop: "rooftop",
  view: "scenic_views",
  waterfront: "waterfront",
  historic: "historic",
  modern: "modern",
  vintage: "vintage",
  hipster: "trendy",
  trendy: "trendy",
  upscale: "upscale",
  casual: "casual",

  // Other categories
  hotel: "hotels",
  shopping: "shopping",
  retail: "shopping",
  store: "shopping",
  market: "shopping",
  grocery: "grocery",
  gas: "gas_stations",
  parking: "parking",
  bank: "banks",
  atm: "banks",
  pharmacy: "pharmacy",
  hospital: "hospitals",
  doctor: "hospitals",
  dentist: "dentists",
  gym: "fitness",
  fitness: "fitness",
  spa: "beautysvc",
  salon: "beautysvc",
  beauty: "beautysvc",
  movie: "movietheaters",
  theater: "movietheaters",
  cinema: "movietheaters",
  museum: "museums",
  art: "museums",
  park: "parks",
  beach: "beaches",
  school: "education",
  university: "education",
  college: "education",
};

// Location patterns for extraction
export const LOCATION_PATTERNS_YELP = [
  /(?:washington|dc|washington dc)/gi,
  /(?:san francisco|sf|bay area)/gi,
  /(?:new york|nyc|manhattan)/gi,
  /(?:los angeles|la|hollywood)/gi,
  /(?:chicago|chi)/gi,
  /(?:boston|beantown)/gi,
  /(?:seattle|emerald city)/gi,
  /(?:miami|south beach)/gi,
  /(?:denver|mile high)/gi,
];

// Function to extract location from text
export function extractLocationFromText(
  text: string,
  userLocation?: string
): string {
  let location = "";

  // First, try to extract location from text
  for (const pattern of LOCATION_PATTERNS_YELP) {
    const match = text.match(pattern);
    if (match) {
      location = match[0].toLowerCase().includes("dc")
        ? "Washington DC"
        : match[0].toLowerCase().includes("sf")
          ? "San Francisco, CA"
          : match[0].toLowerCase().includes("nyc")
            ? "New York, NY"
            : match[0].toLowerCase().includes("la")
              ? "Los Angeles, CA"
              : match[0].toLowerCase().includes("chi")
                ? "Chicago, IL"
                : match[0].toLowerCase().includes("boston")
                  ? "Boston, MA"
                  : match[0].toLowerCase().includes("seattle")
                    ? "Seattle, WA"
                    : match[0].toLowerCase().includes("miami")
                      ? "Miami, FL"
                      : match[0].toLowerCase().includes("denver")
                        ? "Denver, CO"
                        : match[0];
      break;
    }
  }

  // Use user's current location as last resort
  if (!location && userLocation) {
    location = userLocation;
  }

  return location;
}

// Function to extract category from query
export function extractCategoryFromQuery(
  query: string,
  notesContent?: string
): string {
  let category = "";
  const queryLower = query.toLowerCase();
  const notesLower = notesContent ? notesContent.toLowerCase() : "";

  // Check for explicit category terms in query (prioritize exact matches)
  const queryWords = queryLower.split(/\s+/);
  for (const word of queryWords) {
    if (CATEGORY_MAP[word]) {
      category = CATEGORY_MAP[word];
      break;
    }
  }

  // If no exact match, check for partial matches in query
  if (!category) {
    for (const [term, cat] of Object.entries(CATEGORY_MAP)) {
      if (queryLower.includes(term)) {
        category = cat;
        break;
      }
    }
  }

  // If still no category, check notes content
  if (!category && notesLower) {
    for (const [term, cat] of Object.entries(CATEGORY_MAP)) {
      if (notesLower.includes(term)) {
        category = cat;
        break;
      }
    }
  }

  return category;
}

// Function to clean search terms
export function cleanSearchTerms(query: string): string {
  let searchTerm = query;

  // Remove location patterns
  for (const pattern of LOCATION_PATTERNS_YELP) {
    searchTerm = searchTerm.replace(pattern, "").trim();
  }

  // Remove only explicit category terms, keep descriptive/ambiance terms
  const explicitCategoryTerms = [
    "coffee",
    "cafe",
    "coffeeshop",
    "coffeehouse",
    "espresso",
    "restaurant",
    "food",
    "dining",
    "bar",
    "pub",
    "brewery",
    "wine",
    "cocktail",
    "hotel",
    "shopping",
    "store",
    "market",
  ];

  for (const term of explicitCategoryTerms) {
    searchTerm = searchTerm
      .replace(new RegExp(`\\b${term}\\b`, "gi"), "")
      .trim();
  }

  // Clean up extra spaces
  searchTerm = searchTerm.replace(/\s+/g, " ").trim();

  // If search term is empty or too short, use the original query
  if (!searchTerm || searchTerm.length < 3) {
    searchTerm = query;
  }

  return searchTerm;
}
