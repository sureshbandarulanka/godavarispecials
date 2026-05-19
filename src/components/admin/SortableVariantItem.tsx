import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Variant {
  id: string;
  weight: string;
  price: number;
}

interface SortableVariantItemProps {
  variant: Variant;
  index: number;
  onVariantChange: (id: string, field: keyof Variant, value: string | number) => void;
  onRemove: (id: string) => void;
  disableRemove: boolean;
}

export default function SortableVariantItem({ 
  variant, 
  index, 
  onVariantChange, 
  onRemove,
  disableRemove
}: SortableVariantItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variant.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="variant-item">
      <div 
        {...attributes} 
        {...listeners} 
        style={{ cursor: 'grab', padding: '0 8px', display: 'flex', alignItems: 'center', color: '#94a3b8' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </div>
      <input 
        type="text" 
        placeholder="Weight (e.g. 500g)" 
        className="form-input" 
        value={variant.weight}
        onChange={(e) => onVariantChange(variant.id, 'weight', e.target.value)}
        required
      />
      <input 
        type="number" 
        placeholder="Price (₹)" 
        className="form-input" 
        value={variant.price === 0 ? '' : variant.price}
        onChange={(e) => onVariantChange(variant.id, 'price', Number(e.target.value))}
        required
      />
      <button 
        type="button" 
        className="btn-icon delete" 
        onClick={() => onRemove(variant.id)}
        disabled={disableRemove}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  );
}
