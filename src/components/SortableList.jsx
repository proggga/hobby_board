import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { X, Trash2, Plus, GripVertical } from 'lucide-react';
import { SortableSubList } from './SortableSubList';

export function SortableList({ list, colors, onDelete, onUpdateName, onUpdateWidth, onAddSubList, onDeleteSubList, onUpdateSubListName, onUpdateSubListColor, onAddSticker, onDeleteSticker, onUpdateSticker, newlyCreatedStickerId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `list-${list.id}`,
    data: {
      type: 'list',
      list
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Resizing Logic
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(280, Math.min(800, e.clientX - listRef.current.getBoundingClientRect().left));
      onUpdateWidth(list.id, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isResizing, list.id, onUpdateWidth]);


  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? 'none' : transition, // Disable transition while resizing for smoothness
    opacity: isDragging ? 0.5 : 1,
    width: `${list.width || 320}px`
  };

  const getSubListTotal = (subList) => {
    return subList.stickers.reduce((sum, sticker) => sum + Number(sticker.price), 0);
  };

  const getListTotal = (list) => {
    return list.subLists.reduce((sum, subList) => sum + getSubListTotal(subList), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        listRef.current = node;
      }}
      style={style}
      className={`${list.color} rounded-3xl p-4 shadow-xl relative flex-shrink-0 flex flex-col group/list`}
    >
      <div className="flex justify-between items-center mb-2 group relative">
        {/* Drag Handle */}
        <div 
           {...attributes}
           {...listeners}
           className="mr-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
            <GripVertical size={20} />
        </div>

        {/* Name Section */}
        <div className="flex-grow mr-2 min-w-0">
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={list.name}
                    onChange={(e) => onUpdateName(list.id, e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="text-xl font-bold bg-white/50 border-none focus:outline-none w-full text-gray-800 rounded px-1"
                    placeholder="Option Name"
                    onPointerDown={(e) => e.stopPropagation()} 
                />
            ) : (
                <div
                    onDoubleClick={() => setIsEditing(true)}
                    className="text-xl font-bold text-gray-800 truncate px-1 border border-transparent hover:border-black/5 rounded cursor-text"
                    title={list.name}
                >
                    {list.name}
                </div>
            )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-lg font-bold text-gray-800 bg-white/50 px-2 py-1 rounded-lg backdrop-blur-sm whitespace-nowrap">
            ${getListTotal(list).toLocaleString()}
            </span>
            <button
            onClick={() => onDelete(list.id)}
            className="p-1.5 bg-white/50 hover:bg-white rounded-full text-gray-500 hover:text-red-600 transition-all shadow-sm cursor-pointer opacity-0 group-hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()} 
            >
            <Trash2 size={16} />
            </button>
        </div>
      </div>
      
      <div className="space-y-3 flex-grow">
        <SortableContext items={list.subLists.map(sl => `sublist-${sl.id}`)} strategy={verticalListSortingStrategy}>
          {list.subLists.map(subList => (
            <SortableSubList
              key={subList.id}
              subList={subList}
              listId={list.id}
              colors={colors}
              onDelete={onDeleteSubList}
              onUpdateName={onUpdateSubListName}
              onUpdateColor={onUpdateSubListColor}
              onAddSticker={onAddSticker}
              onDeleteSticker={onDeleteSticker}
              onUpdateSticker={onUpdateSticker}
              newlyCreatedStickerId={newlyCreatedStickerId}
            />
          ))}
        </SortableContext>
      </div>

      <button
        onClick={() => onAddSubList(list.id)}
        className="mt-4 w-full py-2 bg-white/40 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-400/50 hover:border-gray-500 hover:bg-white/60 flex items-center justify-center gap-2 font-semibold text-gray-600 transition-all cursor-pointer text-sm flex-shrink-0"
      >
        <Plus size={16} /> New Group
      </button>

      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 w-3 h-full cursor-col-resize hover:bg-black/5 transition-colors z-20 rounded-r-3xl"
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
        }}
      />
    </div>
  );
}
