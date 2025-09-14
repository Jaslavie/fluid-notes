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
  className = "",
  soundEnabled = true,
}: TextAreaProps) {
  const [displayText, setDisplayText] = useState(value);
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
      } catch (error) {}
    }
  }, [soundEnabled]);

  const throttledPlaySound = useCallback(() => {
    const now = Date.now();
    if (now - lastCharTimeRef.current > 50) {
      playTypewriterSound();
      lastCharTimeRef.current = now;
    }
  }, [playTypewriterSound]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const oldLength = value.length;
      const newLength = newValue.length;

      if (newLength !== oldLength) {
        throttledPlaySound();
      }

      setDisplayText(newValue);
      onChange(newValue);
    },
    [value, onChange, throttledPlaySound]
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

  return (
    <textarea
      ref={textareaRef}
      value={displayText}
      onChange={handleChange}
      placeholder={placeholder}
      className={`
        w-full h-96 p-4 flex 
        bg-transparent border-none outline-none
         text-gray-800
        resize-none
        ${className}
      `}
      style={{
        lineHeight: "1.6",
        fontSize: "16px",
      }}
    />
  );
}
