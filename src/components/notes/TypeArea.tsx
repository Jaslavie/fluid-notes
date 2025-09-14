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
  placeholder = "Type here...",
  className = "",
  soundEnabled = true,
}: TextAreaProps) {
  const [displayText, setDisplayText] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCharTimeRef = useRef<number>(0);

  //* all function calls
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
  //* all typing functions
  // create bullet points
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPosition); // get substring before the cursor
      const textAfterCursor = textarea.value.substring(cursorPosition); // get substring after the cursor

      // Handle Enter key
      if (e.key === "Enter") {
        e.preventDefault();

        const lines = textBeforeCursor.split("\n"); // get all lines that currently exist
        const currentLine = lines[lines.length - 1]; // get the current line

        // Check if current line has a bullet point
        if (currentLine.trim().startsWith("•")) {
          // Continue bullet point on new line
          const newText = textBeforeCursor + "\n• " + textAfterCursor;
          setDisplayText(newText);
          onChange(newText);

          // reset the cursor position for the user's next input
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              cursorPosition + 3; // 3 spaces after the bullet point
          }, 0);
        } else {
          // if the current line does not have a bullet point, add a new line
          const newText = textBeforeCursor + "\n" + textAfterCursor;
          setDisplayText(newText);
          onChange(newText);

          // reset the cursor position for the user's next input
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
          lines[lines.length - 1] = "• "; // replace the current line with a bullet point
          const newText = lines.join("\n") + textAfterCursor; // join the lines back together
          setDisplayText(newText);
          onChange(newText); // update the display text

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              cursorPosition + 1;
          }, 0);
        }
      }
    },
    [onChange, throttledPlaySound]
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
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`
        w-full h-96 p-4 flex 
        bg-transparent border-none outline-none
         text-gray-800
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
  );
}
