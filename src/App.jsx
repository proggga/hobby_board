import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Save, Upload, HelpCircle, FileText, Download, Share2 } from 'lucide-react';
import LZString from 'lz-string';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable';

import { SortableList } from './components/SortableList';
import { SortableSubList } from './components/SortableSubList';
import { SortableSticker } from './components/SortableSticker';
import { StickerEditorModal } from './components/StickerEditorModal';

export default function BoardComparisonApp() {
  // Terminology:
  // Board -> The whole page (App)
  // List -> Option A, Option B
  // Sub-list -> Equipment, Software
  // Sticker -> Laptop, Monitor

  const [lists, setLists] = useState(() => {
    const saved = localStorage.getItem('boardData');
    let initialData = saved ? JSON.parse(saved) : [
      {
        id: 'list-1',
        name: 'Option A',
        color: 'bg-blue-100',
        subLists: [
          {
            id: 'sub-1',
            name: 'Equipment',
            color: 'bg-yellow-200',
            stickers: [
              { id: 'sticker-1', name: 'Laptop', price: 1200, description: 'High performance laptop' },
              { id: 'sticker-2', name: 'Monitor', price: 300, description: '27-inch 4K' }
            ]
          },
          {
            id: 'sub-2',
            name: 'Software',
            color: 'bg-pink-200',
            stickers: [
              { id: 'sticker-3', name: 'Adobe Suite', price: 600, description: 'Creative Cloud All Apps' }
            ]
          }
        ]
      },
      {
        id: 'list-2',
        name: 'Option B',
        color: 'bg-green-100',
        subLists: [
          {
            id: 'sub-3',
            name: 'Equipment',
            color: 'bg-purple-200',
            stickers: [
              { id: 'sticker-4', name: 'Desktop', price: 1500, description: 'Gaming PC' },
              { id: 'sticker-5', name: 'Dual Monitors', price: 600, description: 'Two 24-inch screens' }
            ]
          }
        ]
      }
    ];

    // Safety check for duplicate IDs which breaks dnd-kit
    const seenIds = new Set();
    const ensureUniqueId = (prefix) => {
      let newId = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
      while (seenIds.has(newId)) {
        newId = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
      }
      seenIds.add(newId);
      return newId;
    };

    // Traverse and fix IDs if they are just numbers or duplicates
    initialData = initialData.map(list => {
      const listId = seenIds.has(String(list.id)) ? ensureUniqueId('list') : String(list.id);
      seenIds.add(listId);
      
      return {
        ...list,
        id: listId,
        width: list.width || 320, // Ensure width exists
        subLists: list.subLists.map(subList => {
          const subListId = seenIds.has(String(subList.id)) ? ensureUniqueId('sub') : String(subList.id);
          seenIds.add(subListId);

          return {
            ...subList,
            id: subListId,
            stickers: subList.stickers.map(sticker => {
              const stickerId = seenIds.has(String(sticker.id)) ? ensureUniqueId('sticker') : String(sticker.id);
              seenIds.add(stickerId);
              return { ...sticker, id: stickerId };
            })
          };
        })
      };
    });

    return initialData;
  });

  const [activeId, setActiveId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [newlyCreatedStickerId, setNewlyCreatedStickerId] = useState(null);
  const [editingSticker, setEditingSticker] = useState(null);
  
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    localStorage.setItem('boardData', JSON.stringify(lists));
  }, [lists]);

  const colors = ['bg-yellow-200', 'bg-pink-200', 'bg-blue-200', 'bg-green-200', 'bg-purple-200', 'bg-orange-200', 'bg-red-200', 'bg-teal-200'];

  const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addList = () => {
    const newList = {
      id: generateId('list'),
      name: `Option ${lists.length + 1}`,
      color: 'bg-blue-100',
      width: 320,
      subLists: []
    };
    setLists([...lists, newList]);
  };

  const resetBoard = () => {
    if (window.confirm('Are you sure you want to create a new board? This will delete all current data.')) {
      const newId1 = generateId('list');
      const newId2 = generateId('list');
      const subId1 = generateId('sub');
      const subId2 = generateId('sub');
      
      setLists([
        {
          id: newId1,
          name: 'Option 1',
          color: 'bg-blue-100',
          width: 320,
          subLists: [
            {
              id: subId1,
              name: 'Basics',
              color: 'bg-yellow-200',
              stickers: [
                { id: generateId('sticker'), name: 'Item A', price: 100, color: 'bg-yellow-200' },
                { id: generateId('sticker'), name: 'Item B', price: 50, color: 'bg-yellow-200' }
              ]
            }
          ]
        },
        {
          id: newId2,
          name: 'Option 2',
          color: 'bg-green-100',
          width: 320,
          subLists: [
            {
              id: subId2,
              name: 'Basics',
              color: 'bg-pink-200',
              stickers: [
                { id: generateId('sticker'), name: 'Item A', price: 120, color: 'bg-pink-200' }
              ]
            }
          ]
        }
      ]);
    }
  };

  const deleteList = (listId) => {
    if (window.confirm('Are you sure you want to delete this option?')) {
      setLists(lists.filter(b => b.id !== listId));
    }
  };

  const updateListWidth = (listId, newWidth) => {
    setLists(lists.map(list => 
      list.id === listId ? { ...list, width: newWidth } : list
    ));
  };

  const addSubList = (listId) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          subLists: [...list.subLists, {
            id: generateId('sub'),
            name: 'New Group',
            color: colors[list.subLists.length % colors.length], // Default color for new group
            stickers: []
          }]
        };
      }
      return list;
    }));
  };

  const deleteSubList = (listId, subListId) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          subLists: list.subLists.filter(g => g.id !== subListId)
        };
      }
      return list;
    }));
  };

  const updateSubListColor = (listId, subListId, newColor) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          subLists: list.subLists.map(subList => 
            subList.id === subListId ? { ...subList, color: newColor } : subList
          )
        };
      }
      return list;
    }));
  };

  const addSticker = (listId, subListId) => {
    const newId = generateId('sticker');
    setNewlyCreatedStickerId(newId);
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          subLists: list.subLists.map(subList => {
            if (subList.id === subListId) {
              return {
                ...subList,
                stickers: [...subList.stickers, {
                  id: newId,
                  name: 'New Sticker',
                  price: 0,
                  color: subList.color // Use sublist color as default for new sticker
                }]
              };
            }
            return subList;
          })
        };
      }
      return list;
    }));
  };

  const deleteSticker = (e, listId, subListId, stickerId) => {
    e?.stopPropagation();
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          subLists: list.subLists.map(subList => {
            if (subList.id === subListId) {
              return {
                ...subList,
                stickers: subList.stickers.filter(i => i.id !== stickerId)
              };
            }
            return subList;
          })
        };
      }
      return list;
    }));
  };

  const updateListName = (listId, newName) => {
    setLists(lists.map(list => 
      list.id === listId ? { ...list, name: newName } : list
    ));
  };

  const updateSubListName = (listId, subListId, newName) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          subLists: list.subLists.map(subList =>
            subList.id === subListId ? { ...subList, name: newName } : subList
          )
        };
      }
      return list;
    }));
  };

  const updateSticker = (listId, subListId, stickerId, field, value) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          subLists: list.subLists.map(subList => {
            if (subList.id === subListId) {
              return {
                ...subList,
                stickers: subList.stickers.map(sticker => 
                  sticker.id === stickerId ? { ...sticker, [field]: value } : sticker
                )
              };
            }
            return subList;
          })
        };
      }
      return list;
    }));
  };

  const handleShare = () => {
    try {
      const dataStr = JSON.stringify(lists);
      const compressed = LZString.compressToEncodedURIComponent(dataStr);
      const url = `${window.location.origin}${window.location.pathname}?data=${compressed}`;
      
      navigator.clipboard.writeText(url).then(() => {
        alert('Shareable link copied to clipboard!');
      }, (err) => {
        console.error('Could not copy text: ', err);
        prompt('Copy this link:', url);
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link.');
    }
  };

  const handleSaveToFile = () => {
    const filename = prompt('Enter filename to save:', 'board-data');
    if (!filename) return;

    const dataStr = JSON.stringify(lists, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename.endsWith('.json') ? filename : filename + '.json'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadFromFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedData = JSON.parse(e.target.result);
          setLists(loadedData);
        } catch (error) {
          alert('Error parsing JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const openStickerDetails = (listId, subList, sticker) => {
    // Legacy function, replaced by handleEditSticker but kept if needed or can be removed
    setEditingSticker({ ...sticker, listId, subListId: subList.id });
  };

  const handleEditSticker = (listId, subListId, sticker) => {
    setEditingSticker({ ...sticker, listId, subListId });
  };

  const handleSaveSticker = (updatedSticker) => {
    const { listId, subListId } = editingSticker;
    setLists(lists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          subLists: list.subLists.map(subList => {
            if (subList.id === subListId) {
              return {
                ...subList,
                stickers: subList.stickers.map(s => 
                  s.id === updatedSticker.id ? updatedSticker : s
                )
              };
            }
            return subList;
          })
        };
      }
      return list;
    }));
    setEditingSticker(null);
  };

  // Drag and Drop Logic
  const findListByStickerId = (id) => {
    for (const list of lists) {
      for (const subList of list.subLists) {
        if (subList.stickers.find((s) => `sticker-${s.id}` === id)) {
          return list;
        }
      }
    }
    return null;
  };
  
  const findSubListByStickerId = (id) => {
    for (const list of lists) {
      for (const subList of list.subLists) {
        if (subList.stickers.find((s) => `sticker-${s.id}` === id)) {
          return subList;
        }
      }
    }
    return null;
  };

  const findListBySubListId = (id) => {
    for (const list of lists) {
      if (list.subLists.find((s) => `sublist-${s.id}` === id)) {
        return list;
      }
    }
    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const { id, data } = active;
    setActiveId(id);
    setActiveItem(data.current);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Handling Sticker Drag Over
    if (activeType === 'sticker') {
      const activeSubList = findSubListByStickerId(activeId);
      const overSubList = findSubListByStickerId(overId) || (overType === 'sublist' ? over.data.current.subList : null);

      if (!activeSubList || !overSubList) return;

      if (activeSubList.id !== overSubList.id) {
        setLists((prev) => {
          const activeList = findListByStickerId(activeId);
          const overList = findListByStickerId(overId) || findListBySubListId(`sublist-${overSubList.id}`);
          
          if (!activeList || !overList) return prev;

          const newLists = [...prev];
          
          const sourceListIndex = newLists.findIndex(l => l.id === activeList.id);
          const sourceSubListIndex = newLists[sourceListIndex].subLists.findIndex(s => s.id === activeSubList.id);
          const sourceStickers = newLists[sourceListIndex].subLists[sourceSubListIndex].stickers;
          const stickerIndex = sourceStickers.findIndex(s => `sticker-${s.id}` === activeId);
          
          if (stickerIndex === -1) return prev;

          const [movedSticker] = sourceStickers.splice(stickerIndex, 1);

          const destListIndex = newLists.findIndex(l => l.id === overList.id);
          const destSubListIndex = newLists[destListIndex].subLists.findIndex(s => s.id === overSubList.id);
          const destStickers = newLists[destListIndex].subLists[destSubListIndex].stickers;

          let newIndex;
          if (overType === 'sticker') {
            newIndex = destStickers.findIndex(s => `sticker-${s.id}` === overId);
          } else {
            newIndex = destStickers.length;
          }

          if (newIndex === -1) newIndex = destStickers.length;
          
          destStickers.splice(newIndex, 0, movedSticker);

          return newLists;
        });
      }
    }
    
    // Handling SubList Drag Over between Lists
    if (activeType === 'sublist' && (overType === 'sublist' || overType === 'list')) {
        const activeList = findListBySubListId(activeId);
        const overList = overType === 'list' ? over.data.current.list : findListBySubListId(overId);
        
        if (!activeList || !overList || activeList.id === overList.id) return;
        
        setLists((prev) => {
            const newLists = [...prev];
            const sourceListIndex = newLists.findIndex(l => l.id === activeList.id);
            const sourceSubLists = newLists[sourceListIndex].subLists;
            const subListIndex = sourceSubLists.findIndex(s => `sublist-${s.id}` === activeId);
            
            if (subListIndex === -1) return prev;
            
            const [movedSubList] = sourceSubLists.splice(subListIndex, 1);
            
            const destListIndex = newLists.findIndex(l => l.id === overList.id);
            const destSubLists = newLists[destListIndex].subLists;
            
            let newIndex = destSubLists.length;
            if (overType === 'sublist') {
                const overSubListIndex = destSubLists.findIndex(s => `sublist-${s.id}` === overId);
                if (overSubListIndex !== -1) newIndex = overSubListIndex;
            }
            
            destSubLists.splice(newIndex, 0, movedSubList);
            
            return newLists;
        });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const activeType = active.data.current?.type;

    if (activeType === 'list' && over && active.id !== over.id) {
        setLists((items) => {
            const oldIndex = items.findIndex((item) => `list-${item.id}` === active.id);
            const newIndex = items.findIndex((item) => `list-${item.id}` === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    } else if (activeType === 'sublist' && over) {
        const activeList = findListBySubListId(active.id);
        const overList = findListBySubListId(over.id);
        
        if (activeList && overList && activeList.id === overList.id) {
             const listIndex = lists.findIndex(l => l.id === activeList.id);
             const subLists = lists[listIndex].subLists;
             const oldIndex = subLists.findIndex(s => `sublist-${s.id}` === active.id);
             const newIndex = subLists.findIndex(s => `sublist-${s.id}` === over.id);
             
             if (oldIndex !== newIndex) {
                 const newLists = [...lists];
                 newLists[listIndex].subLists = arrayMove(subLists, oldIndex, newIndex);
                 setLists(newLists);
             }
        }
    } else if (activeType === 'sticker' && over) {
        const activeSubList = findSubListByStickerId(active.id);
        const overSubList = findSubListByStickerId(over.id);
        
        if (activeSubList && overSubList && activeSubList.id === overSubList.id) {
             const list = findListByStickerId(active.id);
             const listIndex = lists.findIndex(l => l.id === list.id);
             const subListIndex = lists[listIndex].subLists.findIndex(s => s.id === activeSubList.id);
             const stickers = lists[listIndex].subLists[subListIndex].stickers;
             
             const oldIndex = stickers.findIndex(s => `sticker-${s.id}` === active.id);
             const newIndex = stickers.findIndex(s => `sticker-${s.id}` === over.id);
             
             if (oldIndex !== newIndex) {
                 const newLists = [...lists];
                 newLists[listIndex].subLists[subListIndex].stickers = arrayMove(stickers, oldIndex, newIndex);
                 setLists(newLists);
             }
        }
    }

    setActiveId(null);
    setActiveItem(null);
  };


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-full mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-gray-800">Board Comparison</h1>
              <button 
                onClick={() => setShowHelp(true)}
                className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-sm hover:shadow-md transition-all"
                title="Help & Terminology"
              >
                <HelpCircle size={24} />
              </button>
            </div>
            <div className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLoadFromFile}
                className="hidden"
                accept=".json"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:shadow-md transition-all font-semibold border border-gray-200"
              >
                <Upload size={20} /> Load
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:shadow-md transition-all font-semibold border border-gray-200"
              >
                <Share2 size={20} /> Share
              </button>
              <button
                onClick={handleSaveToFile}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:shadow-md transition-all font-semibold border border-gray-200"
              >
                <Download size={20} /> Save
              </button>
              <button
                onClick={resetBoard}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:shadow-md transition-all font-semibold border border-red-200"
              >
                <Trash2 size={20} /> New Board
              </button>
            </div>
          </div>

          <div className="flex gap-8 overflow-x-auto pb-12 items-start min-h-[calc(100vh-140px)]">
            <SortableContext items={lists.map(l => `list-${l.id}`)} strategy={horizontalListSortingStrategy}>
              {lists.map(list => (
                <SortableList
                  key={list.id}
                  list={list}
                  colors={colors}
                  onDelete={deleteList}
                  onUpdateName={updateListName}
                  onUpdateWidth={updateListWidth}
                  onAddSubList={addSubList}
                  onDeleteSubList={deleteSubList}
                  onUpdateSubListName={updateSubListName}
                  onUpdateSubListColor={updateSubListColor}
                  onAddSticker={addSticker}
                  onDeleteSticker={deleteSticker}
                  onUpdateSticker={updateSticker}
                  newlyCreatedStickerId={newlyCreatedStickerId}
                  onEditSticker={handleEditSticker}
                />
              ))}
            </SortableContext>
            
            <button
               onClick={addList}
               className="flex-shrink-0 w-16 h-full flex items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-500 transition-all min-h-[200px]"
            >
              <Plus size={32} />
            </button>
          </div>

          <DragOverlay>
            {activeId && activeItem ? (
                activeItem.type === 'list' ? (
                     <SortableList
                        list={activeItem.list}
                        colors={colors}
                        onDelete={() => {}}
                        onUpdateName={() => {}}
                        onUpdateWidth={() => {}}
                        onAddSubList={() => {}}
                        onDeleteSubList={() => {}}
                        onUpdateSubListName={() => {}}
                        onUpdateSubListColor={() => {}}
                        onAddSticker={() => {}}
                        onDeleteSticker={() => {}}
                        onUpdateSticker={() => {}}
                    />
                ) : activeItem.type === 'sublist' ? (
                    <SortableSubList
                        subList={activeItem.subList}
                        listId={activeItem.listId}
                        colors={colors}
                        onDelete={() => {}}
                        onUpdateName={() => {}}
                        onUpdateColor={() => {}}
                        onAddSticker={() => {}}
                        onDeleteSticker={() => {}}
                        onUpdateSticker={() => {}}
                    />
                ) : activeItem.type === 'sticker' ? (
                     <SortableSticker
                        sticker={activeItem.sticker}
                        listId={activeItem.listId}
                        subListId={activeItem.subListId}
                        color={activeItem.sticker.color}
                        colors={colors}
                        onDelete={() => {}}
                        onUpdate={() => {}}
                    />
                ) : null
            ) : null}
          </DragOverlay>

          {/* Sticker Edit Modal */}
          {editingSticker && (
            <StickerEditorModal
              sticker={editingSticker}
              onClose={() => setEditingSticker(null)}
              onSave={handleSaveSticker}
            />
          )}

          {/* Help Modal */}
          {showHelp && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full relative">
                <button
                  onClick={() => setShowHelp(false)}
                  className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
                
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                  <HelpCircle className="text-purple-600" />
                  Terminology & Help
                </h2>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-2">Board</h3>
                    <p className="text-blue-800 text-sm">The whole page you are looking at. It contains all your different options for comparison.</p>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 bg-green-50 p-4 rounded-xl border border-green-100">
                      <h3 className="font-bold text-green-900 mb-2">List</h3>
                      <p className="text-green-800 text-sm">A vertical column representing a specific scenario (e.g., Option A).</p>
                    </div>
                    
                    <div className="flex-1 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                      <h3 className="font-bold text-yellow-900 mb-2">Sub-list</h3>
                      <p className="text-yellow-800 text-sm">A container bubble for categorizing items (e.g., Equipment).</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <h3 className="font-bold text-purple-900 mb-2">Sticker</h3>
                    <p className="text-purple-800 text-sm">An individual sticky note with a name, price, and description. Click on any sticker to edit details.</p>
                  </div>

                  <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-100">
                    Data is automatically saved to your browser. Use the Save/Load buttons to export/import your data.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}
