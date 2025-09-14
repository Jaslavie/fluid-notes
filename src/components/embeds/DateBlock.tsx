"use client";

import Block from "@/components/tokens/Block";

interface DateBlockProps {
  dateText: string;
  onEdit?: (newText: string) => void;
}

export default function DateBlock({ dateText, onEdit }: DateBlockProps) {
  const handleClick = () => {
    if (onEdit) {
      const newText = prompt("Edit date:", dateText);
      if (newText && newText.trim()) {
        onEdit(newText.trim());
      }
    }
  };

  return (
    <Block
      icon={<i className="fas fa-clock text-gray-600"></i>}
      onClick={handleClick}
    >
      {dateText}
    </Block>
  );
}