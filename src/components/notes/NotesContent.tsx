"use client";

import { useState, useEffect } from "react";
import EditableTitle from "../tokens/EditableTitle";
import TypeArea from "@/components/notes/TypeArea";

interface NoteContent {
  id: string;
  title: string;
  content: string;
  tags: string[];
  dateRange?: string;
}

interface NotesContentProps {
  selectedNote: NoteContent | null;
  onContentChange: (content: string) => void;
  onTitleChange: (newTitle: string) => void;
  soundEnabled: boolean;
}

export default function NotesContent({
  selectedNote,
  onContentChange,
  onTitleChange,
  soundEnabled,
}: NotesContentProps) {
  const [content, setContent] = useState(selectedNote?.content || "");

  useEffect(() => {
    if (selectedNote) {
      setContent(selectedNote.content);
    }
  }, [selectedNote]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange(newContent);
  };

  if (!selectedNote) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <h2 className="text-xl font-medium mb-2">No note selected</h2>
          <p>Select a note from the left sidebar to start writing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="p-6">
        <EditableTitle
          title={selectedNote.title}
          onTitleChange={onTitleChange}
          className="text-2xl font-bold text-gray-900 mb-2 cursor-pointer"
        />
      </div>

      <div className="flex-1">
        <div className="max-w-4xl">
          {/* Date Range Tag */}
          {selectedNote.dateRange && (
            <div className="mb-4">
              <span className="tag">{selectedNote.dateRange}</span>
            </div>
          )}

          {/* Typewriter Textarea */}
          <div className="mt-6">
            <TypeArea
              value={content}
              onChange={handleContentChange}
              placeholder="Start writing your notes here..."
              soundEnabled={soundEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
