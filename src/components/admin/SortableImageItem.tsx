"use client";
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableImageItemProps {
  id: string;
  url: string;
  index: number;
  onRemove: (index: number) => void;
  isMain?: boolean;
}

export default function SortableImageItem({ id, url, index, onRemove, isMain }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="preview-item"
    >
      <img src={url} alt={`Preview ${index + 1}`} />
      
      <button 
        type="button" 
        className="remove-preview" 
        onClick={(e) => { 
          e.stopPropagation(); 
          onRemove(index); 
        }}
      >
        ×
      </button>

      {/* Drag Handle */}
      <div className="drag-handle" {...attributes} {...listeners}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>

      {isMain && <span className="primary-badge">Main</span>}
    </div>
  );
}
