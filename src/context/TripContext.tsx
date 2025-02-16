import React, { createContext, useContext, useState } from 'react';

interface TripDates {
  start: string;
  end: string;
}

interface Destination {
  place: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface TripData {
  destinations: Destination[];
  accommodation: string;
  activities: string[];
  companions: string;
  dates: TripDates;
}

interface TripContextType {
  trip: TripData | null;
  updateTrip: (data: TripData) => void;
  packingLists: PackingLists;
  updatePackingLists: (lists: PackingLists) => void;
}

export interface PackingLists {
  accommodations: Record<string, string[]>;
  activities: Record<string, string[]>;
  companions: Record<string, string[]>;
  general: string[];
}

const defaultPackingLists: PackingLists = {
  accommodations: {
    camping: [
      'Tent',
      'Inflatable mattress',
      'Blanket',
      'Linens',
      'LED string lights'
    ],
    glamping: [
      'Sheets',
      'Pillows'
    ],
    hotel: [
      'Bathing suit'
    ]
  },
  activities: {
    work: [
      'Laptop',
      'Phone charger',
      'Work documents'
    ],
    cooking: [
      'Chef Knife',
      'Spices (Salt, Pepper, etc)'
    ],
    party: [
      'Portable Speaker',
      'Party clothes'
    ],
    skiing: [
      'Ski clothes',
      'Ski socks'
    ],
    climbing: [
      'Tape',
      'Climbing pants',
      'Dry-fit shirts',
      'Sun protective sleeves'
    ]
  },
  companions: {
    alone: [
      'Book',
      'Headphones'
    ],
    spouse: [
      'Couple games',
      'Romantic playlist'
    ],
    friends: [
      'Party games',
      'Snacks to share'
    ],
    family: [
      'First aid kit',
      'Family games'
    ]
  },
  general: [
    'Lip Balm',
    'Phone charger',
    'Toiletries',
    'Medications',
    'Wallet',
    'ID/Passport'
  ]
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [trip, setTrip] = useState<TripData | null>(null);
  const [packingLists, setPackingLists] = useState<PackingLists>(defaultPackingLists);

  const updateTrip = (data: TripData) => {
    setTrip(data);
  };

  const updatePackingLists = (lists: PackingLists) => {
    setPackingLists(lists);
  };

  return (
    <TripContext.Provider value={{ trip, updateTrip, packingLists, updatePackingLists }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTripContext() {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTripContext must be used within a TripProvider');
  }
  return context;
}