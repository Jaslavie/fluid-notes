"use client";

import { useState } from "react";

interface EditableTitleProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  className?: string;
  placeholder?: string;
  tag?: keyof React.JSX.IntrinsicElements; // allow any html tag
}

export default function EditableTitle({
  title,
  onTitleChange,
  className = "font-medium text-gray-900 hover:text-blue-600 transition-colors",
  placeholder = "Enter title...",
  tag: Tag = "h1", // Default to h1, but can be overridden
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

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

  return (
    <>
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleTitleSubmit}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none font-medium text-gray-900"
          autoFocus
          placeholder={placeholder}
        />
      ) : (
        <Tag className={className} onClick={handleTitleClick}>
          {title}
        </Tag>
      )}
    </>
  );
}
