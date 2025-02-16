import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Plus, X, CloudRain, Thermometer, Wind, Save, FolderOpen } from 'lucide-react';
import { useTripContext } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { Loader } from '@googlemaps/js-api-loader';
import axios from 'axios';
import SaveListModal from './SaveListModal';
import SavedLists from './SavedLists';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const VISUAL_CROSSING_API_KEY = import.meta.env.VITE_VISUAL_CROSSING_API_KEY;

const accommodationOptions = [
  { id: 'hotel', label: 'Hotel', icon: '🏨' },
  { id: 'camping', label: 'Camping', icon: '⛺' },
  { id: 'glamping', label: 'Glamping', icon: '🏕️' },
];

const activityOptions = [
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'cooking', label: 'Cooking', icon: '👨‍🍳' },
  { id: 'party', label: 'Party', icon: '🎉' },
  { id: 'skiing', label: 'Skiing', icon: '⛷️' },
  { id: 'climbing', label: 'Climbing', icon: '🧗‍♂️' },
];

const companionOptions = [
  { id: 'alone', label: 'Alone', icon: '🧍' },
  { id: 'spouse', label: 'Spouse', icon: '👫' },
  { id: 'friends', label: 'Friends', icon: '👥' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
];

interface WeatherData {
  date: string;
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  pop: number;
}

interface Destination {
  place: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  weatherData?: WeatherData[];
  mapRef?: google.maps.Map;
  markerRef?: google.maps.Marker;
  lastSearched?: string;
}

function getWeatherIcon(condition: string): string {
  const iconMap: { [key: string]: string } = {
    'clear-day': '01d',
    'clear-night': '01n',
    'partly-cloudy-day': '02d',
    'partly-cloudy-night': '02n',
    'cloudy': '03d',
    'rain': '10d',
    'snow': '13d',
    'sleet': '13d',
    'wind': '50d',
    'fog': '50d',
  };
  return iconMap[condition.toLowerCase()] || '01d';
}

function TripSetup() {
  const { updateTrip, trip, packingLists } = useTripContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [destinations, setDestinations] = useState<Destination[]>([{ place: '' }]);
  const [accommodation, setAccommodation] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [companion, setCompanion] = useState('');
  const [showPackingList, setShowPackingList] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedLists, setShowSavedLists] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const { isAuthenticated } = useAuth();
  const [dates, setDates] = useState(() => {
    const today = new Date();
    const thursday = new Date(today);
    thursday.setDate(today.getDate() + ((4 - today.getDay() + 7) % 7));
    const sunday = new Date(thursday);
    sunday.setDate(thursday.getDate() + 3);
    
    return {
      start: thursday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  });

  const mapDivRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError('Google Maps API key is required.');
      return;
    }

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then(() => {
      setMapsLoaded(true);
      geocoderRef.current = new google.maps.Geocoder();

      destinations.forEach((destination, index) => {
        if (mapDivRefs.current[index] && !destination.mapRef) {
          const mapOptions: google.maps.MapOptions = {
            center: { lat: 20, lng: 0 },
            zoom: 2,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          };
          
          const map = new google.maps.Map(mapDivRefs.current[index]!, mapOptions);
          setDestinations(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              mapRef: map
            };
            return updated;
          });

          if (destination.place && !destination.coordinates) {
            handleDestinationChange(index, destination.place);
          }
        }
      });
    }).catch(error => {
      setMapError('Failed to load Google Maps.');
      console.error('Google Maps loading error:', error);
    });

    return () => {
      searchTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      destinations.forEach(dest => {
        if (dest.markerRef) {
          dest.markerRef.setMap(null);
        }
      });
    };
  }, [destinations.length]);

  const fetchWeather = async (coordinates: { lat: number; lng: number }, index: number) => {
    if (!VISUAL_CROSSING_API_KEY) {
      console.error('Visual Crossing API key is missing');
      return;
    }

    try {
      const response = await axios.get(
        `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${coordinates.lat},${coordinates.lng}/${dates.start}/${dates.end}?key=${VISUAL_CROSSING_API_KEY}&unitGroup=metric&include=days`,
        { 
          headers: { 'Accept-Encoding': 'gzip' }
        }
      );

      if (!response.data || !response.data.days) {
        console.error('Invalid weather data format:', response.data);
        return;
      }

      const weatherForecast = response.data.days.map((day: any) => {
        const data = {
          date: day.datetime,
          temp: Math.round(day.temp),
          feels_like: Math.round(day.feelslike),
          humidity: day.humidity,
          wind_speed: Math.round(day.windspeed),
          description: day.conditions || 'No description available',
          icon: `https://openweathermap.org/img/wn/${getWeatherIcon(day.icon || 'clear-day')}@2x.png`,
          pop: Math.round(day.precipprob || 0)
        };
        return JSON.parse(JSON.stringify(data));
      });

      setDestinations(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          weatherData: weatherForecast
        };
        return updated;
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  useEffect(() => {
    destinations.forEach((destination, index) => {
      if (destination.coordinates) {
        fetchWeather(destination.coordinates, index);
      }
    });
  }, [dates.start, dates.end]);

  const handleDestinationChange = (index: number, value: string) => {
    if (!mapsLoaded || !geocoderRef.current) {
      console.warn('Maps not loaded yet');
      return;
    }

    if (searchTimeoutRef.current[index]) {
      clearTimeout(searchTimeoutRef.current[index]);
    }

    setDestinations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], place: value };
      return updated;
    });

    if (value.trim() && value !== destinations[index].lastSearched) {
      searchTimeoutRef.current[index] = setTimeout(() => {
        geocoderRef.current?.geocode({ address: value }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            const coordinates = {
              lat: location.lat(),
              lng: location.lng(),
            };

            setDestinations(prev => {
              const updated = [...prev];
              const currentDest = updated[index];

              if (!currentDest.mapRef) {
                console.warn('Map reference not found');
                return prev;
              }

              if (currentDest.markerRef) {
                currentDest.markerRef.setMap(null);
              }

              const marker = new google.maps.Marker({
                position: location,
                map: currentDest.mapRef,
                animation: google.maps.Animation.DROP
              });

              currentDest.mapRef.setCenter(location);
              currentDest.mapRef.setZoom(10);

              updated[index] = {
                ...currentDest,
                coordinates,
                markerRef: marker,
                lastSearched: value
              };
              return updated;
            });

            fetchWeather(coordinates, index);
          }
        });
      }, 500);
    }
  };

  const handleAddDestination = () => {
    setDestinations(prev => [...prev, { place: '' }]);
  };

  const handleRemoveDestination = (index: number) => {
    if (destinations.length > 1) {
      if (searchTimeoutRef.current[index]) {
        clearTimeout(searchTimeoutRef.current[index]);
      }
      
      setDestinations(prev => {
        const updated = [...prev];
        if (updated[index].markerRef) {
          updated[index].markerRef.setMap(null);
        }
        return updated.filter((_, i) => i !== index);
      });
    }
  };

  const handleActivityToggle = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const generatePackingList = () => {
    const items = new Set<string>();

    packingLists.general.forEach(item => items.add(item));

    if (accommodation && packingLists.accommodations[accommodation]) {
      packingLists.accommodations[accommodation].forEach(item => items.add(item));
    }

    selectedActivities.forEach(activity => {
      if (packingLists.activities[activity]) {
        packingLists.activities[activity].forEach(item => items.add(item));
      }
    });

    if (companion && packingLists.companions[companion]) {
      packingLists.companions[companion].forEach(item => items.add(item));
    }

    return Array.from(items);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      const tripData = {
        destinations: destinations.map(({ place, coordinates }) => ({ place, coordinates })),
        accommodation,
        activities: selectedActivities,
        companions: companion,
        dates,
      };
      updateTrip(tripData);
      setShowPackingList(true);
    }
  };

  if (showPackingList && trip) {
    const packingItems = generatePackingList();

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-slate">Your Packing List</h2>
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate hover:text-turquoise transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save List
                </button>
                <button
                  onClick={() => setShowSavedLists(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate hover:text-turquoise transition-colors"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Open Saved
                </button>
              </>
            )}
            <button
              onClick={() => setShowPackingList(false)}
              className="text-sm text-coral hover:text-coral/80"
            >
              Edit Trip Details
            </button>
          </div>
        </div>

        <div className="mb-6 p-4 bg-slate/5 rounded-lg">
          <div className="space-y-2">
            {trip.destinations.map((dest, index) => (
              <div key={index} className="flex items-center space-x-4 text-slate">
                <MapPin className="h-5 w-5" />
                <span>{dest.place}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-4 mt-2 text-slate">
            <Calendar className="h-5 w-5" />
            <span>{trip.dates.start} to {trip.dates.end}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-peach/20 text-slate">
              {accommodationOptions.find(opt => opt.id === accommodation)?.icon} {accommodation}
            </span>
            {selectedActivities.map(activity => (
              <span key={activity} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-turquoise/20 text-slate">
                {activityOptions.find(opt => opt.id === activity)?.icon} {activity}
              </span>
            ))}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-coral/20 text-slate">
              {companionOptions.find(opt => opt.id === companion)?.icon} {companion}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-medium text-slate mb-4">Your Packing List</h3>
            <ul className="space-y-3">
              {packingItems.map((item, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`item-${index}`}
                    className="rounded text-turquoise focus:ring-turquoise"
                  />
                  <label htmlFor={`item-${index}`} className="text-slate">{item}</label>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {showSaveModal && <SaveListModal onClose={() => setShowSaveModal(false)} />}
        {showSavedLists && <SavedLists onClose={() => setShowSavedLists(false)} />}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-slate">Create Your Packing List</h2>
        <div className="flex items-center space-x-2">
          {[1, 2, 3].map(step => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full ${
                step === currentStep
                  ? 'bg-coral'
                  : step < currentStep
                  ? 'bg-peach'
                  : 'bg-slate/20'
              }`}
            />
          ))}
        </div>
      </div>

      {currentStep === 1 && (
        <div className="space-y-6">
          {destinations.map((destination, index) => (
            <div key={index} className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label
                    htmlFor={`destination-${index}`}
                    className="block text-sm font-medium text-slate mb-1"
                  >
                    {index === 0 ? 'Where are you going?' : `Additional Stop ${index + 1}`}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate/40 h-5 w-5" />
                    <input
                      type="text"
                      id={`destination-${index}`}
                      value={destination.place}
                      onChange={(e) => handleDestinationChange(index, e.target.value)}
                      className="pl-10 w-full rounded-lg border-slate/20 shadow-sm focus:border-turquoise focus:ring-turquoise"
                      placeholder="Enter destination"
                    />
                  </div>
                </div>
                {destinations.length > 1 && (
                  <button
                    onClick={() => handleRemoveDestination(index)}
                    className="p-2 text-slate/60 hover:text-coral transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {mapError ? (
                <div className="p-4 bg-coral/10 rounded-lg border border-coral/20">
                  <p className="text-sm text-coral">{mapError}</p>
                </div>
              ) : (
                <div 
                  ref={el => mapDivRefs.current[index] = el}
                  className="w-full h-64 rounded-lg overflow-hidden shadow-md"
                  style={{ display: destination.place ? 'block' : 'none' }}
                />
              )}
            </div>
          ))}

          <button
            onClick={handleAddDestination}
            className="mt-4 w-full py-3 border-2 border-dashed border-slate/20 rounded-lg text-slate hover:border-turquoise hover:text-turquoise transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Another Destination
          </button>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate mb-1">
              When are you traveling?
            </label>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <input
                  type="date"
                  value={dates.start}
                  onChange={(e) => setDates(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full rounded-lg border-slate/20 shadow-sm focus:border-turquoise focus:ring-turquoise"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={dates.end}
                  onChange={(e) => setDates(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full rounded-lg border-slate/20 shadow-sm focus:border-turquoise focus:ring-turquoise"
                />
              </div>
            </div>

            {destinations.map((destination, index) => (
              destination.weatherData && destination.weatherData.length > 0 && (
                <div key={index} className="mb-8 p-6 bg-slate/5 rounded-lg">
                  <h3 className="text-lg font-medium text-slate mb-4">
                    Weather in {destination.place}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {destination.weatherData.map((weather, wIndex) => (
                      <div key={wIndex} className="bg-white p-4 rounded-lg shadow-sm border border-slate/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate">
                            {new Date(weather.date).toLocaleDateString(undefined, { 
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <img src={weather.icon} alt={weather.description} className="w-12 h-12" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-slate">
                              <Thermometer className="h-4 w-4" />
                              <span className="text-lg font-semibold">{weather.temp}°C</span>
                            </div>
                            <span className="text-sm text-slate/60">
                              Feels like {weather.feels_like}°C
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-slate">
                            <CloudRain className="h-4 w-4" />
                            <span className="text-sm">
                              {weather.pop}% chance of rain
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-slate">
                            <Wind className="h-4 w-4" />
                            <span className="text-sm">
                              {weather.wind_speed} m/s
                            </span>
                          </div>

                          <div className="text-sm text-slate/80">
                            {weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-slate mb-3">
              Where will you be sleeping?
            </label>
            <div className="grid grid-cols-3 gap-4">
              {accommodationOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setAccommodation(option.id)}
                  className={`p-4 rounded-lg border ${
                    accommodation === option.id
                      ? 'border-turquoise bg-turquoise/5'
                      : 'border-slate/20 hover:border-turquoise/20'
                  } transition-colors duration-200`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="text-sm font-medium text-slate">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate mb-3">
              What will you be doing?
            </label>
            <div className="grid grid-cols-3 gap-4">
              {activityOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleActivityToggle(option.id)}
                  className={`p-4 rounded-lg border ${
                    selectedActivities.includes(option.id)
                      ? 'border-peach bg-peach/5'
                      : 'border-slate/20 hover:border-peach/20'
                  } transition-colors duration-200`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="text-sm font-medium text-slate">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate mb-3">
              Who are you traveling with?
            </label>
            <div className="grid grid-cols-4 gap-4">
              {companionOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setCompanion(option.id)}
                  className={`p-4 rounded-lg border ${
                    companion === option.id
                      ? 'border-coral bg-coral/5'
                      : 'border-slate/20 hover:border-coral/20'
                  } transition-colors duration-200`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="text-sm font-medium text-slate">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        {currentStep > 1 && (
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="mr-4 px-4 py-2 text-sm font-medium text-slate hover:text-slate/80"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={
            (currentStep === 1 && destinations.some(d => !d.place)) ||
            (currentStep === 2 && (!dates.start || !dates.end)) ||
            (currentStep === 3 && (!accommodation || selectedActivities.length === 0 || !companion))
          }
          className="px-6 py-2 bg-coral text-white rounded-lg hover:bg-coral/90 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === 3 ? 'Create List' : 'Next'}
        </button>
      </div>
    </div>
  );
}

export default TripSetup;