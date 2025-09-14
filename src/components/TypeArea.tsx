"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  soundEnabled?: boolean;
}

export default function TypeArea({
  value,
  onChange,
  placeholder = "Start writing your notes here...",
  className = "w-full h-96 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  soundEnabled = true,
}: TextAreaProps) {
  const [displayText, setDisplayText] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCharTimeRef = useRef<number>(0);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio("/typewriter.mp3"); // This references public/typewriter.mp3
    audioRef.current.volume = 0.3; // Lower volume for better UX
    audioRef.current.preload = "auto";
  }, []);

  // Play typewriter sound from MP3 file
  const playTypewriterSound = useCallback(() => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Silently fail if audio can't play (user interaction required)
      });
    }
  }, [soundEnabled]);

  // Throttled sound playing to avoid audio spam
  const throttledPlaySound = useCallback(() => {
    const now = Date.now();
    if (now - lastCharTimeRef.current > 50) {
      playTypewriterSound();
      lastCharTimeRef.current = now;
    }
  }, [playTypewriterSound]);

  // Handle text changes with typewriter effect - play sound for any change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const oldLength = value.length;
      const newLength = newValue.length;

      // Play sound for any text change (adding or deleting)
      if (newLength !== oldLength) {
        throttledPlaySound();
      }

      // Update display text immediately without animation delay
      setDisplayText(newValue);
      onChange(newValue);
    },
    [value, onChange, throttledPlaySound]
  );

  // Update display text when value changes externally
  useEffect(() => {
    setDisplayText(value);
  }, [value]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={displayText}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      style={{
        lineHeight: "1.25",
        fontSize: "16px",
      }}
    />
  );
}
