import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTripContext, PackingLists } from '../context/TripContext';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

function Settings({ isOpen, onClose }: SettingsProps) {
  const { packingLists, updatePackingLists } = useTripContext();
  const [currentList, setCurrentList] = useState<keyof PackingLists>('general');
  const [newItem, setNewItem] = useState('');
  const [selectedSublist, setSelectedSublist] = useState<string>('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const updatedLists = { ...packingLists };
    if (currentList === 'general') {
      updatedLists.general = [...updatedLists.general, newItem.trim()];
    } else if (selectedSublist) {
      updatedLists[currentList][selectedSublist] = [
        ...updatedLists[currentList][selectedSublist],
        newItem.trim()
      ];
    }

    updatePackingLists(updatedLists);
    setNewItem('');
  };

  const handleRemoveItem = (item: string) => {
    const updatedLists = { ...packingLists };
    if (currentList === 'general') {
      updatedLists.general = updatedLists.general.filter(i => i !== item);
    } else if (selectedSublist) {
      updatedLists[currentList][selectedSublist] = updatedLists[currentList][selectedSublist].filter(i => i !== item);
    }
    updatePackingLists(updatedLists);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate">Packing List Settings</h2>
            <button
              onClick={onClose}
              className="text-slate/60 hover:text-slate"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex space-x-4 mb-6">
            <select
              value={currentList}
              onChange={(e) => {
                setCurrentList(e.target.value as keyof PackingLists);
                setSelectedSublist('');
              }}
              className="rounded-lg border-slate/20 shadow-sm focus:border-turquoise focus:ring-turquoise"
            >
              <option value="general">General Items</option>
              <option value="accommodations">Accommodations</option>
              <option value="activities">Activities</option>
              <option value="companions">Travel Companions</option>
            </select>

            {currentList !== 'general' && (
              <select
                value={selectedSublist}
                onChange={(e) => setSelectedSublist(e.target.value)}
                className="rounded-lg border-slate/20 shadow-sm focus:border-turquoise focus:ring-turquoise"
              >
                <option value="">Select {currentList.slice(0, -1)}</option>
                {Object.keys(packingLists[currentList]).map(key => (
                  <option key={key} value={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <form onSubmit={handleAddItem} className="mb-6">
            <div className="flex space-x-4">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add new item"
                className="flex-1 rounded-lg border-slate/20 shadow-sm focus:border-turquoise focus:ring-turquoise"
              />
              <button
                type="submit"
                disabled={!newItem.trim() || (currentList !== 'general' && !selectedSublist)}
                className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
            </div>
          </form>

          <div className="max-h-[50vh] overflow-y-auto">
            {currentList === 'general' ? (
              <ul className="space-y-2">
                {packingLists.general.map((item, index) => (
                  <li key={index} className="flex items-center justify-between p-2 hover:bg-slate/5 rounded-lg">
                    <span className="text-slate">{item}</span>
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="text-coral hover:text-coral/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : selectedSublist ? (
              <ul className="space-y-2">
                {packingLists[currentList][selectedSublist].map((item, index) => (
                  <li key={index} className="flex items-center justify-between p-2 hover:bg-slate/5 rounded-lg">
                    <span className="text-slate">{item}</span>
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="text-coral hover:text-coral/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate/60 text-center">Select a category to view items</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;