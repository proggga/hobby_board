import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { X, Plus, Palette, GripVertical } from 'lucide-react';
import { SortableSticker } from './SortableSticker';

export function SortableSubList({ subList, listId, colors, onDelete, onUpdateName, onUpdateColor, onAddSticker, onDeleteSticker, onUpdateSticker, newlyCreatedStickerId, onEditSticker }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `sublist-${subList.id}`,
    data: {
      type: 'sublist',
      subList,
      listId
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSubListTotal = (subList) => {
    return subList.stickers.reduce((sum, sticker) => sum + Number(sticker.price), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
    e.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative bg-white/40 rounded-2xl p-3 border-2 border-white/50 backdrop-blur-sm shadow-sm"
    >
      <div className="flex items-center justify-between mb-2 relative">
        <div className="flex items-center gap-1 flex-grow mr-2 min-w-0">
           {/* Drag Handle */}
           <div 
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mr-1 flex-shrink-0"
           >
                <GripVertical size={16} />
           </div>

           <button
             onClick={(e) => {
               e.stopPropagation();
               setShowColorPicker(!showColorPicker);
             }}
             className="p-1 rounded-full hover:bg-black/5 text-gray-500 cursor-pointer flex-shrink-0"
             onPointerDown={(e) => e.stopPropagation()}
             title="Set Default Color"
           >
             <Palette size={14} />
           </button>

           {isEditing ? (
             <input
                ref={inputRef}
                type="text"
                value={subList.name}
                onChange={(e) => onUpdateName(listId, subList.id, e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="text-base font-bold bg-white/50 border-none focus:outline-none text-gray-800 w-full rounded px-1"
                placeholder="Group Name"
                onPointerDown={(e) => e.stopPropagation()} 
              />
           ) : (
             <div
                onDoubleClick={() => setIsEditing(true)}
                className="text-base font-bold text-gray-800 truncate w-full px-1 border border-transparent hover:border-black/5 rounded cursor-text"
                title={subList.name}
             >
                {subList.name}
             </div>
           )}
        </div>
        
        {/* Color Picker Popover */}
        {showColorPicker && (
          <div className="absolute top-8 left-0 z-20 bg-white rounded-xl shadow-xl p-2 flex gap-1 border border-gray-100" onPointerDown={(e) => e.stopPropagation()}>
            {colors.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full ${color} border border-black/10 hover:scale-110 transition-transform ${subList.color === color ? 'ring-2 ring-purple-500' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateColor(listId, subList.id, color);
                  setShowColorPicker(false);
                }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="bg-white px-1.5 py-0.5 rounded-md shadow-sm font-bold text-xs text-purple-600">
            ${getSubListTotal(subList).toLocaleString()}
          </div>
          <button
            onClick={() => onDelete(listId, subList.id)}
            className="p-1 bg-white rounded-full hover:bg-red-50 text-red-600 shadow-sm cursor-pointer"
            onPointerDown={(e) => e.stopPropagation()} 
          >
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2 min-h-[40px]">
        <SortableContext items={subList.stickers.map(s => `sticker-${s.id}`)} strategy={rectSortingStrategy}>
          {subList.stickers.map(sticker => (
            <SortableSticker
              key={sticker.id}
              sticker={sticker}
              listId={listId}
              subListId={subList.id}
              colors={colors}
              onDelete={onDeleteSticker}
              onUpdate={onUpdateSticker}
              autoFocus={newlyCreatedStickerId === sticker.id}
              onEdit={onEditSticker}
            />
          ))}
        </SortableContext>
        
        <button
          onClick={() => onAddSticker(listId, subList.id)}
          className={`${subList.color} rounded-xl py-2 shadow-sm border-2 border-dashed border-gray-400/50 flex items-center justify-center hover:border-gray-500 transition-all cursor-pointer opacity-60 hover:opacity-100 min-h-[42px]`}
        >
          <Plus size={16} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}
