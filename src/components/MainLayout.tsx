"use client";

import { useState } from "react";
import NotesList from "@/components/NotesList";
import NotesContent from "./NotesContent";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  dateRange?: string;
  isSelected: boolean;
}

export default function MainLayout() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const handleNoteSelect = (noteId: string) => {
    setNotes(
      notes.map((note) => ({
        ...note,
        isSelected: note.id === noteId,
      }))
    );
    setSelectedNoteId(noteId);
  };

  const handleNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "New Note", // default
      content: "",
      tags: [],
      isSelected: true,
    };

    setNotes(notes.map((note) => ({ ...note, isSelected: false })));
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  };

  //* handle title changes and change to title in db
  const handleTitleChange = (noteId: string, newTitle: string) => {
    setNotes(
      notes.map((note) =>
        note.id === noteId ? { ...note, title: newTitle } : note
      )
    );
  };
  const handleSelectedNoteTitleChange = (newTitle: string) => {
    if (selectedNoteId) {
      handleTitleChange(selectedNoteId, newTitle);
    }
  };

  //* when user changes content, update the content in the db
  const handleContentChange = (content: string) => {
    if (!selectedNoteId) return;
    setNotes(
      notes.map((note) =>
        note.id === selectedNoteId ? { ...note, content } : note
      )
    );
  };

  //* get a variable to store the selected note from the db for rendering
  const selectedNote = selectedNoteId
    ? notes.find((note) => note.id === selectedNoteId) || null
    : null;

  return (
    <div className="flex h-screen bg-gray-50">
      <NotesList
        notes={notes}
        onNoteSelect={handleNoteSelect}
        onNewNote={handleNewNote}
        onTitleChange={handleTitleChange}
      />
      <NotesContent
        selectedNote={selectedNote}
        onContentChange={handleContentChange}
        onTitleChange={handleSelectedNoteTitleChange}
      />
    </div>
  );
}
