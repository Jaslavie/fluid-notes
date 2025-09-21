import { NextResponse, NextRequest } from "next/server";
import {
  extractLocationFromText,
  extractCategoryFromQuery,
  cleanSearchTerms,
} from "@/services/Keywords";

// Parse query using Keywords.ts functions
function parseQueryForYelp(
  query: string,
  userLocation?: string,
  notesContent?: string
): {
  location: string;
  category: string;
  searchTerm: string;
} {
  // Extract location from notes content first, then query, then user location
  let location = "";

  if (notesContent) {
    location = extractLocationFromText(notesContent, userLocation);
  }

  if (!location) {
    location = extractLocationFromText(query, userLocation);
  }

  // Extract category from query and notes content
  const category = extractCategoryFromQuery(query, notesContent);

  // Clean search terms
  const searchTerm = cleanSearchTerms(query);

  return {
    location: location || "",
    category: category || "",
    searchTerm: searchTerm || "",
  };
}

//* --- main yelp api call --- *//
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const userLocation = searchParams.get("location");
    const notesContent = searchParams.get("notesContent");

    console.log("Yelp API: Received request for query:", query);
    console.log("Yelp API: User location:", userLocation);
    console.log("Yelp API: Notes content length:", notesContent?.length || 0);

    if (!query) {
      console.log("Yelp API: No query parameter provided");
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) {
      console.log("Yelp API: API key not configured");
      return NextResponse.json(
        { error: "Yelp API key not configured" },
        { status: 500 }
      );
    }

    console.log("Yelp API: API key found, making request to Yelp...");

    // Extract location and category intelligently
    const { location, category, searchTerm } = parseQueryForYelp(
      query,
      userLocation || undefined,
      notesContent || undefined
    );

    console.log("Yelp search params:", {
      location,
      category,
      searchTerm: searchTerm || "",
    });

    //* search based on category, query, and location
    let yelpUrl = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}&limit=10`;

    // Only add categories parameter if we have a category
    if (category) {
      yelpUrl += `&categories=${category}`;
    }
    const response = await fetch(yelpUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Yelp API: Request failed with status:", response.status);
      throw new Error(`Yelp API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      "Yelp API: Received",
      data.businesses?.length || 0,
      "businesses"
    );

    // Transform the results to match our LocationResult interface
    const results = data.businesses.map(
      (business: {
        id: string;
        name: string;
        rating: number;
        coordinates?: { latitude: number; longitude: number };
        location?: { address1?: string; display_address?: string[] };
        categories?: Array<{ title: string; alias: string }>;
      }) => ({
        place_id: business.id,
        name: business.name,
        description:
          business.categories?.map((cat) => cat.title).join(", ") || "",
        formatted_address:
          business.location?.address1 ||
          business.location?.display_address?.join(", ") ||
          "",
        geometry: {
          location: {
            lat: business.coordinates?.latitude || 0,
            lng: business.coordinates?.longitude || 0,
          },
        },
        rating: business.rating,
        types: business.categories?.map((cat) => cat.alias) || [],
      })
    );

    console.log("Yelp API: Returning", results.length, "transformed results");
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Yelp API: Location search error:", error);
    return NextResponse.json(
      { error: "Failed to search locations" },
      { status: 500 }
    );
  }
}
