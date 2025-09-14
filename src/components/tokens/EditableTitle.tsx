"use client";

import { useState, useRef, useEffect } from "react";

interface EditableTitleProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  className?: string;
  placeholder?: string;
  tag?: keyof React.JSX.IntrinsicElements;
}

export default function EditableTitle({
  title,
  onTitleChange,
  className = "font-medium text-gray-700 transition-colors",
  placeholder = "Enter title...",
  tag: Tag = "h1",
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [inputWidth, setInputWidth] = useState(0);
  const titleRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Measure the title width when component mounts or title changes
  useEffect(() => {
    if (titleRef.current) {
      const width = titleRef.current.offsetWidth;
      setInputWidth(Math.max(width, 100)); // Minimum width of 100px
    }
  }, [title]);

  const handleTitleClick = () => {
    setIsEditing(true);
    setEditTitle(title);
  };

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle.trim() !== title) {
      onTitleChange(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  };

  // Update input width as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditTitle(newValue);

    // Create a temporary element to measure the new width
    if (inputRef.current) {
      const tempElement = document.createElement(Tag as string);
      tempElement.style.visibility = "hidden";
      tempElement.style.position = "absolute";
      tempElement.style.fontSize = window.getComputedStyle(
        inputRef.current
      ).fontSize;
      tempElement.style.fontFamily = window.getComputedStyle(
        inputRef.current
      ).fontFamily;
      tempElement.style.fontWeight = window.getComputedStyle(
        inputRef.current
      ).fontWeight;
      tempElement.textContent = newValue || placeholder;

      document.body.appendChild(tempElement);
      const newWidth = tempElement.offsetWidth;
      document.body.removeChild(tempElement);

      setInputWidth(Math.max(newWidth, 100));
    }
  };

  return (
    <>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={handleInputChange}
          onBlur={handleTitleSubmit}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none font-medium text-gray-700"
          style={{
            width: `${inputWidth}px`,
            fontSize: "inherit",
            fontFamily: "inherit",
            fontWeight: "inherit",
          }}
          autoFocus
          placeholder={placeholder}
        />
      ) : (
        <Tag
          ref={titleRef}
          className={`${className} cursor-pointer`}
          onClick={handleTitleClick}
        >
          {title}
        </Tag>
      )}
    </>
  );
}
