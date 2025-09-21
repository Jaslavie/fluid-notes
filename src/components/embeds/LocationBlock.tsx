"use client";

import { useState, useEffect, useRef } from "react";
import Block from "../tokens/Block";
import SearchService, { LocationResult } from "@/services/Search";

interface LocationBlockProps {
  query: string;
  notesContent: string;
  onLocationSelect?: (location: LocationResult) => void;
  onSearchComplete?: () => void;
}

export default function LocationBlock({
  query,
  notesContent,
  onLocationSelect,
  onSearchComplete,
}: LocationBlockProps) {
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Loading query...");
  const isSearchingRef = useRef(false);
  const searchIdRef = useRef<string | null>(null);

  useEffect(() => {
    const searchLocation = async () => {
      if (!query.trim()) {
        console.log("Empty query, skipping search");
        return;
      }

      // Create a unique search ID for this query 
      // const currentSearchId = `${query}-${Date.now()}`;

      // Prevent multiple simultaneous searches
      if (isSearchingRef.current) {
        console.log("Search already in progress, skipping");
        return;
      }

      // Check if we already have a result for this query
      if (location && location.name) {
        console.log("Location already found, skipping search");
        return;
      }

      // Check if this is the same search as before
      if (searchIdRef.current === query) {
        console.log("Same search already processed, skipping");
        return;
      }

      console.log("LocationBlock: Starting search for:", query);
      searchIdRef.current = query;
      isSearchingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Animated loading messages
      const loadingMessages = [
        "Loading query...",
        "Searching for the best vibe match...",
        "Analyzing ambiance factors...",
        "Finding perfect location...",
        "Matching your preferences...",
      ];

      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        setLoadingMessage(loadingMessages[messageIndex]);
        messageIndex = (messageIndex + 1) % loadingMessages.length;
      }, 1500);

      try {
        const searchService = SearchService.getInstance();
        console.log("Initializing model...");
        await searchService.initializeModel();
        console.log("Model initialized");

        console.log("Searching with context...");
        const result = await searchService.searchLocationsWithContext(
          query,
          notesContent
        );

        if (result) {
          console.log("LocationBlock: Found location:", result.name);
          setLocation(result);
          // Automatically select the location when found
          if (onLocationSelect) {
            onLocationSelect(result);
          }
        } else {
          console.log(
            "LocationBlock: No location found, trying simplified search..."
          );
          // Try a simplified search with just the basic query
          const simplifiedResult = await searchService.searchLocations(
            query,
            notesContent
          );
          if (simplifiedResult && simplifiedResult.results.length > 0) {
            console.log(
              "LocationBlock: Found location with simplified search:",
              simplifiedResult.results[0].name
            );
            setLocation(simplifiedResult.results[0]);
            // Automatically select the location when found
            if (onLocationSelect) {
              onLocationSelect(simplifiedResult.results[0]);
            }
          } else {
            console.log(
              "LocationBlock: No location found even with simplified search"
            );
            setLocation(null);
          }
        }
      } catch (err) {
        console.error("LocationBlock: Search error:", err);
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        clearInterval(messageInterval);
        setIsLoading(false);
        isSearchingRef.current = false;
        onSearchComplete?.();
      }
    };

    searchLocation();
  }, [query, notesContent, onSearchComplete, location, onLocationSelect]);

  const handleLocationClick = () => {
    if (location && onLocationSelect) {
      onLocationSelect(location);
    }
  };

  //* loading state
  if (isLoading) {
    return <Block className="bg-blue-50 animate-pulse">{loadingMessage}</Block>;
  }

  if (error) {
    return (
      <Block className="bg-red-50 text-red-600">Search failed: {error}</Block>
    );
  }

  if (!location) {
    return (
      <Block className="bg-gray-50 text-gray-500">
        No location found for {query}
      </Block>
    );
  }

  const handleYelpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Create Yelp URL from the location data
    const yelpUrl = `https://www.yelp.com/biz/${location.place_id}`;
    window.open(yelpUrl, "_blank");
  };

  //* return the location name and details
  return (
    <div
      className="
        inline-block w-full max-w-md
        bg-gray-50 border border-gray-200 rounded-lg
        p-4 my-2 cursor-pointer
        hover:bg-gray-100 transition-colors
      "
      onClick={handleLocationClick}
    >
      {/* Title */}
      <div className="font-medium text-gray-800 text-base mb-2">
        {location.name}
      </div>

      {/* Rating */}
      {location.rating && (
        <div className="flex items-center mb-2">
          <span className="text-gray-600 text-sm mr-2">
            {Array.from(
              { length: Math.floor(location.rating) },
              () => "★"
            ).join("")}
          </span>
          <span className="text-gray-500 text-sm">{location.rating}</span>
        </div>
      )}

      {/* Description */}
      {location.description && (
        <div className="text-gray-600 text-sm mb-2">{location.description}</div>
      )}

      {/* Address and Distance */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{location.formatted_address || "Address not available"}</span>
        <button
          onClick={handleYelpClick}
          className="
            flex items-center gap-1
            bg-gray-200 hover:bg-gray-300
            px-2 py-1 rounded
            transition-colors
          "
          title="View on Yelp"
        >
          <i className="fas fa-external-link-alt text-xs"></i>
          <span>View on Yelp</span>
        </button>
      </div>
    </div>
  );
}
