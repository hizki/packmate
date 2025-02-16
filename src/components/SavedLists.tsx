import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTripContext } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { Loader2, Trash2 } from 'lucide-react';

interface SavedList {
  id: string;
  name: string;
  destinations: Array<{ place: string; coordinates?: { lat: number; lng: number } }>;
  accommodation: string;
  activities: string[];
  companions: string;
  dates: { start: string; end: string };
  created_at: string;
}

interface SavedListsProps {
  onClose: () => void;
}

export default function SavedLists({ onClose }: SavedListsProps) {
  const [lists, setLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateTrip } = useTripContext();
  const { user } = useAuth();

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLists(data);
    } catch (err) {
      setError('Failed to load saved lists');
      console.error('Error fetching lists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadList = (list: SavedList) => {
    updateTrip({
      destinations: list.destinations,
      accommodation: list.accommodation,
      activities: list.activities,
      companions: list.companions,
      dates: list.dates,
    });
    onClose();
  };

  const handleDeleteList = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLists(lists.filter(list => list.id !== id));
    } catch (err) {
      setError('Failed to delete list');
      console.error('Error deleting list:', err);
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate/60">Please log in to view saved lists</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate">Saved Lists</h2>
            <button
              onClick={onClose}
              className="text-slate/60 hover:text-slate"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate" />
            </div>
          ) : error ? (
            <div className="p-4 bg-coral/10 rounded-lg border border-coral/20 text-coral">
              {error}
            </div>
          ) : lists.length === 0 ? (
            <p className="text-center text-slate/60 p-8">
              No saved lists yet
            </p>
          ) : (
            <div className="space-y-4">
              {lists.map(list => (
                <div
                  key={list.id}
                  className="p-4 border border-slate/20 rounded-lg hover:bg-slate/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate mb-2">{list.name}</h3>
                      <div className="text-sm text-slate/60">
                        {list.destinations.map(d => d.place).join(', ')}
                      </div>
                      <div className="text-sm text-slate/60 mt-1">
                        {list.dates.start} to {list.dates.end}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleLoadList(list)}
                        className="px-3 py-1 text-sm font-medium text-turquoise hover:text-turquoise/80"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="p-1 text-slate/40 hover:text-coral"
                        title="Delete list"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}