import React, { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripHorizontal, Palette } from 'lucide-react';

export function SortableSticker({ sticker, listId, subListId, colors, onDelete, onUpdate, autoFocus }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `sticker-${sticker.id}`,
    data: {
      type: 'sticker',
      sticker,
      listId,
      subListId
    }
  });

  const [editingField, setEditingField] = useState(null); // 'name' | 'price' | null
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef(null);
  const colorPickerRef = useRef(null);

  useEffect(() => {
    if (autoFocus) {
      setEditingField('name');
    }
  }, [autoFocus]);

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingField]);

  // Click outside to close color picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleBlur = () => {
    if (editingField === 'price') {
       if (!sticker.price || sticker.price === '') {
           onUpdate(listId, subListId, sticker.id, 'price', 0);
       }
    }
    setEditingField(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={(e) => {
        e.preventDefault();
        onEdit && onEdit(listId, subListId, sticker);
      }}
      className={`${sticker.color || 'bg-white/60'} rounded-lg px-3 py-2 shadow-sm transform hover:scale-[1.02] transition-all relative group hover:shadow-md backdrop-blur-sm border border-transparent hover:border-black/5 ${showColorPicker ? 'z-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Name Section */}
        <div className="flex-grow min-w-0">
          {editingField === 'name' ? (
            <input
              ref={inputRef}
              type="text"
              value={sticker.name}
              onChange={(e) => onUpdate(listId, subListId, sticker.id, 'name', e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="font-medium text-sm text-gray-800 bg-white/50 border-none focus:outline-none w-full rounded px-1 -mx-1"
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            sticker.link ? (
              <a 
                href={sticker.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium truncate text-sm text-blue-700 hover:text-blue-900 hover:underline cursor-pointer rounded px-1 -mx-1 block"
                title={sticker.description || sticker.link}
                onDoubleClick={(e) => {
                  setEditingField('name');
                }}
                onPointerDown={(e) => e.stopPropagation()} // Allow clicking without dragging immediately
                onClick={(e) => e.stopPropagation()}
              >
                {sticker.name}
              </a>
            ) : (
              <div 
                className="font-medium truncate text-sm text-gray-800 cursor-text rounded px-1 -mx-1"
                onDoubleClick={(e) => {
                  setEditingField('name');
                }}
                title={sticker.description}
              >
                {sticker.name}
              </div>
            )
          )}
        </div>

        {/* Price Section */}
        <div className="flex-shrink-0 flex items-center relative pl-2 border-l border-black/5">
           <span className="text-xs font-bold text-gray-500 mr-0.5">$</span>
           {editingField === 'price' ? (
            <input
              ref={inputRef}
              type="number"
              value={sticker.price}
              onChange={(e) => onUpdate(listId, subListId, sticker.id, 'price', e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="font-bold text-sm text-gray-800 bg-white/50 border-none focus:outline-none w-16 text-right rounded px-1 -mx-1"
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className="font-bold text-sm text-gray-800 cursor-text rounded px-1 -mx-1 text-right min-w-[20px]"
              onDoubleClick={(e) => {
                setEditingField('price');
              }}
            >
              {sticker.price}
            </div>
          )}
        </div>
      </div>

      {/* Hover Controls (Delete & Color) */}
      <div 
        ref={colorPickerRef}
        className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
         <button
            onClick={(e) => {
               e.stopPropagation();
               setShowColorPicker(!showColorPicker);
            }}
            className="p-1 bg-white rounded-full hover:bg-gray-100 text-gray-500 shadow-sm cursor-pointer border border-gray-200"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Palette size={10} />
          </button>
          <button
            onClick={(e) => onDelete(e, listId, subListId, sticker.id)}
            className="p-1 bg-white rounded-full hover:bg-red-50 text-red-500 shadow-sm cursor-pointer border border-gray-200"
            onPointerDown={(e) => e.stopPropagation()} 
          >
            <X size={10} />
          </button>
          
          {/* Color Picker Popover - moved inside the wrapper ref for click outside logic */}
          {showColorPicker && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl p-2 flex gap-1 border border-gray-100 min-w-max" onPointerDown={(e) => e.stopPropagation()}>
                {colors.map((c) => (
                <button
                    key={c}
                    className={`w-4 h-4 rounded-full ${c} border border-black/10 hover:scale-125 transition-transform ${sticker.color === c ? 'ring-1 ring-black' : ''}`}
                    onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(listId, subListId, sticker.id, 'color', c);
                    setShowColorPicker(false);
                    }}
                />
                ))}
            </div>
        )}
      </div>

    </div>
  );
}
