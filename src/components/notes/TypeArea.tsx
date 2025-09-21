"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import LocationBlock from "../embeds/LocationBlock";
import { LocationResult } from "@/services/Search";

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  soundEnabled?: boolean;
  notesContent?: string;
}

export default function TypeArea({
  value,
  onChange,
  placeholder = "Type here...",
  className = "",
  soundEnabled = true,
  notesContent = "",
}: TextAreaProps) {
  const [displayText, setDisplayText] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [showLocationBlock, setShowLocationBlock] = useState(false);
  const [atQueryLine, setAtQueryLine] = useState<number>(-1);
  // const [hasCompletedSearch, setHasCompletedSearch] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCharTimeRef = useRef<number>(0);

  useEffect(() => {
    audioRef.current = new Audio("/typewriter.mp3");
    audioRef.current.volume = 0.3;
    audioRef.current.preload = "auto";
  }, []);

  const playTypewriterSound = useCallback(() => {
    if (audioRef.current && soundEnabled) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      } catch {}
    }
  }, [soundEnabled]);

  const throttledPlaySound = useCallback(() => {
    const now = Date.now();
    if (now - lastCharTimeRef.current > 50) {
      playTypewriterSound();
      lastCharTimeRef.current = now;
    }
  }, [playTypewriterSound]);

  // detect @ query for location search
  const detectLocationQuery = useCallback((text: string) => {
    const lines = text.split("\n");
    let foundAtLine = -1;
    let query = "";

    // Find the @ query line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("@") && line.length > 1) {
        // Check if this line is already a location result (starts with •)
        const isLocationResult = line.includes("•") || line.includes("-");
        if (!isLocationResult) {
          foundAtLine = i;
          query = line.substring(1);
          break;
        }
      }
    }

    if (foundAtLine >= 0 && query.length > 0) {
      setLocationQuery(query);
      setAtQueryLine(foundAtLine);
      setShowLocationBlock(false); // Don't show block until Enter is pressed
      // setHasCompletedSearch(false); // Reset when starting new search
      setSearchTriggered(false); // Reset search trigger for new query
      return true;
    }

    setShowLocationBlock(false);
    setAtQueryLine(-1);
    return false;
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart;
      const oldLength = value.length;
      const newLength = newValue.length;

      if (newLength !== oldLength) {
        throttledPlaySound();
      }

      setDisplayText(newValue);
      onChange(newValue);

      // detect @ queries for location search
      detectLocationQuery(newValue);
    },
    [value, onChange, throttledPlaySound, detectLocationQuery]
  );

  const performLocationSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      // Prevent multiple searches for the same query
      if (searchTriggered && locationQuery === query) {
        console.log("Search already triggered for:", query);
        return;
      }

      console.log("Location search triggered:", query);
      setIsSearching(true);
      setLocationQuery(query);
      setShowLocationBlock(true);
      setSearchTriggered(true);
      // setHasCompletedSearch(false);
    },
    [searchTriggered, locationQuery]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPosition);
      const textAfterCursor = textarea.value.substring(cursorPosition);

      // Handle Backspace key
      if (e.key === "Backspace") {
        const lines = textBeforeCursor.split("\n");
        const currentLine = lines[lines.length - 1];

        // Check if cursor is right after a bullet point
        if (currentLine.trim() === "•" && cursorPosition > 0) {
          e.preventDefault();

          // Remove the entire bullet point (3 characters: "• ")
          const newText =
            textBeforeCursor.substring(0, cursorPosition - 2) + textAfterCursor;
          setDisplayText(newText);
          onChange(newText);

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              cursorPosition - 2;
          }, 0);

          throttledPlaySound();
          return;
        }
      }

      // Handle Enter key
      if (e.key === "Enter") {
        e.preventDefault();

        // Check if we're in a @ query and trigger search
        const lines = textBeforeCursor.split("\n");
        const currentLine = lines[lines.length - 1];

        if (currentLine.trim().startsWith("@")) {
          const query = currentLine.trim().substring(1);
          if (query.length > 0) {
            performLocationSearch(query);
            return;
          }
        }

        // Handle bullet points
        if (currentLine.trim().startsWith("•")) {
          // Continue bullet point on new line
          const newText = textBeforeCursor + "\n• " + textAfterCursor;
          setDisplayText(newText);
          onChange(newText);

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              cursorPosition + 3;
          }, 0);
        } else {
          // Regular line break
          const newText = textBeforeCursor + "\n" + textAfterCursor;
          setDisplayText(newText);
          onChange(newText);

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              cursorPosition + 1;
          }, 0);
        }

        throttledPlaySound();
        return;
      }

      // Handle space after "*" or "-" to create bullet point
      if (
        e.key === " " &&
        (textBeforeCursor.endsWith("-") || textBeforeCursor.endsWith("*"))
      ) {
        const lines = textBeforeCursor.split("\n");
        const currentLine = lines[lines.length - 1];

        if (currentLine === "*" || currentLine === "-") {
          lines[lines.length - 1] = "• ";
          const newText = lines.join("\n") + textAfterCursor;
          setDisplayText(newText);
          onChange(newText);

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              cursorPosition + 1;
          }, 0);
        }
      }
    },
    [onChange, throttledPlaySound, performLocationSearch]
  );

  useEffect(() => {
    setDisplayText(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle location selection and replace @ query with location card
  const handleLocationSelect = useCallback(
    (location: LocationResult) => {
      console.log("TypeArea: Location selected:", location.name);
      console.log("TypeArea: atQueryLine:", atQueryLine);

      if (atQueryLine >= 0) {
        const lines = displayText.split("\n");
        console.log("TypeArea: Current lines:", lines);

        // Replace the @ query line with location information
        const locationText = `• ${location.name} - ${location.formatted_address}`;
        lines[atQueryLine] = locationText;
        console.log("TypeArea: New line:", locationText);

        const newText = lines.join("\n");
        console.log("TypeArea: New text:", newText);

        setDisplayText(newText);
        onChange(newText);

        // Reset search state
        setShowLocationBlock(false);
        setLocationQuery("");
        setIsSearching(false);
        setAtQueryLine(-1);
        // setHasCompletedSearch(true);
        setSearchTriggered(false);

        // Move cursor to end of line
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPosition = newText.length;
            textareaRef.current.selectionStart =
              textareaRef.current.selectionEnd = newCursorPosition;
          }
        }, 0);
      } else {
        console.log("TypeArea: No @ query line found, cannot replace");
      }
    },
    [displayText, onChange, atQueryLine]
  );

  return (
    <div className="relative h-screen">
      {/* Top blur overlay */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />

      {/* Bottom blur overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

      {/* Loading state */}
      {isSearching && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-gray-50 text-gray-600 p-3 rounded border border-gray-200">
            Searching for locations...
          </div>
        </div>
      )}

      {/* Location search block */}
      {showLocationBlock && locationQuery && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <LocationBlock
            key={`${locationQuery}-${atQueryLine}`}
            query={locationQuery}
            notesContent={notesContent}
            onLocationSelect={handleLocationSelect}
            onSearchComplete={() => setIsSearching(false)}
          />
        </div>
      )}

      <div className="relative w-full h-full">
        <textarea
          ref={textareaRef}
          value={displayText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full h-full p-4
            bg-transparent border-none outline-none
            font-mono text-gray-800
            resize-none
            text-left align-top
            whitespace-pre-wrap break-words
            ${className}
          `}
          spellCheck={true}
          style={{
            lineHeight: "1.6",
            fontSize: "16px",
          }}
        />

        {/* Render @ queries as inline blocks */}
        {displayText.split("\n").map((line, lineIndex) => {
          if (line.trim().startsWith("@") && line.trim().length > 1) {
            const query = line.trim().substring(1);
            return (
              <div
                key={lineIndex}
                className="absolute bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm flex items-center gap-2"
                style={{
                  top: `${lineIndex * 1.6}em`,
                  left: "1rem",
                  zIndex: 10,
                }}
              >
                <span className="text-gray-500">@</span>
                <span className="font-medium">{query}</span>
                {isSearching && lineIndex === atQueryLine && (
                  <span className="text-blue-500 animate-pulse">...</span>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
