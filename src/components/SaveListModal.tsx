import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTripContext } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface SaveListModalProps {
  onClose: () => void;
}

export default function SaveListModal({ onClose }: SaveListModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trip } = useTripContext();
  const { user } = useAuth();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !user) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('saved_lists')
        .insert({
          user_id: user.sub,
          name,
          destinations: trip.destinations,
          accommodation: trip.accommodation,
          activities: trip.activities,
          companions: trip.companions,
          dates: trip.dates,
        });

      if (error) throw error;
      onClose();
    } catch (err) {
      setError('Failed to save list');
      console.error('Error saving list:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate/60">Please log in to save lists</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSave} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate">Save List</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate/60 hover:text-slate"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-coral/10 border border-coral/20 rounded-lg text-coral text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="list-name"
              className="block text-sm font-medium text-slate mb-2"
            >
              List Name
            </label>
            <input
              type="text"
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border-slate/20 shadow-sm focus:border-turquoise focus:ring-turquoise"
              placeholder="Enter a name for your list"
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate hover:text-slate/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save List'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}