import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Sprout, 
  Tractor,
  Navigation,
  Loader2,
  ArrowRight,
  Leaf,
  CloudSun,
  Activity,
  Sun,
  Wind,
  Droplets
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/farm-background.css';

// API endpoints from environment variables
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c';

type LocationData = {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  state?: string;
  district?: string;
};

interface LandingPageProps {
  onSubmit: (location: LocationData, crop: string) => void;
}

// Get user's current location
const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      reject(new Error('Geolocation requires HTTPS or localhost'));
      return;
    }

    console.log('Requesting geolocation...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Geolocation success:', latitude, longitude);
        
        try {
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OPENWEATHER_API_KEY}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
              console.log('Reverse geocoding success:', data[0].name);
              resolve({
                latitude,
                longitude,
                city: data[0].name,
                country: data[0].country,
                state: data[0].state
              });
              return;
            }
          }
          
          resolve({
            latitude,
            longitude,
            city: 'Unknown Location',
            country: 'Unknown'
          });
        } catch (error) {
          console.warn('Reverse geocoding error:', error);
          resolve({
            latitude,
            longitude,
            city: 'Unknown Location',
            country: 'Unknown'
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get location: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out';
            break;
          default:
            errorMessage += error.message;
            break;
        }
        reject(new Error(errorMessage));
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 300000 
      }
    );
  });
};

function LandingPage({ onSubmit }: LandingPageProps) {
  const { t } = useLanguage();
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('Rice');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    setError(null);
    try {
      const locationData = await getCurrentLocation();
      setCurrentLocation(locationData);
      setLocation(`${locationData.city}, ${locationData.country}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get current location');
      // Fallback to Delhi coordinates
      const fallbackLocation = {
        latitude: 28.6139,
        longitude: 77.2090,
        city: 'Delhi',
        country: 'India'
      };
      setCurrentLocation(fallbackLocation);
      setLocation('Delhi, India');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!currentLocation) {
      setError('Please get your location first');
      return;
    }
    onSubmit(currentLocation, crop);
  };

  // Get current location on component mount
  useEffect(() => {
    handleGetCurrentLocation();
  }, []);

  return (
    <div className="split-screen">
      {/* Left Panel - Agricultural Background */}
      <div className="left-panel flex items-center justify-center p-8 lg:p-12 relative">
        <div className="max-w-md text-center relative z-10">
          {/* Animated Tractor Icon */}
          <div className="farm-tractor-icon floating-tractor mb-8">
            <Tractor className="w-16 h-16 text-white" />
          </div>
          
          {/* Hero Content */}
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg">
            {t('home.title')}
          </h1>
          <p className="text-xl text-white mb-8 drop-shadow-md opacity-90">
            Kerala's Smart Agriculture Platform
          </p>
          <p className="text-lg text-white/80 leading-relaxed drop-shadow-sm">
            {t('home.subtitle')}
          </p>

          {/* Floating Features */}
          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-2">
                <CloudSun className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-white/80 font-medium">Weather</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-white/80 font-medium">Soil</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-white/80 font-medium">AI Insights</p>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-16 h-16 bg-yellow-300/20 rounded-full flex items-center justify-center">
          <Sun className="w-8 h-8 text-yellow-300" />
        </div>
        <div className="absolute bottom-20 right-20 w-12 h-12 bg-blue-300/20 rounded-full flex items-center justify-center">
          <Wind className="w-6 h-6 text-blue-300" />
        </div>
        <div className="absolute top-1/2 right-10 w-10 h-10 bg-blue-400/20 rounded-full flex items-center justify-center">
          <Droplets className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="right-panel">
        <div className="w-full max-w-md">

          {/* Farm Login Form */}
          <div className="glass-panel rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Get Started</h2>
              <p className="text-gray-600">Select your location and crop to receive personalized farming insights</p>
            </div>

            <div className="space-y-6">
              {/* Location Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <MapPin className="w-4 h-4 inline mr-2 text-green-600" />
                  {t('home.location')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('home.current_location')}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  />
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={locationLoading}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    title={t('home.current_location')}
                  >
                    {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  </button>
                </div>
                {error && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {error}
                  </p>
                )}
              </div>
              
              {/* Crop Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Sprout className="w-4 h-4 inline mr-2 text-green-600" />
                  {t('home.select_crop')}
                </label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-gray-50 focus:bg-white"
                >
                  {/* Kerala-specific crops */}
                  <option value="Rice">{t('crops.rice')}</option>
                  <option value="Coconut">{t('crops.coconut')}</option>
                  <option value="Black Pepper">{t('crops.black_pepper')}</option>
                  <option value="Cardamom">{t('crops.cardamom')}</option>
                  <option value="Rubber">{t('crops.rubber')}</option>
                  <option value="Tea">{t('crops.tea')}</option>
                  <option value="Coffee">{t('crops.coffee')}</option>
                  <option value="Banana">{t('crops.banana')}</option>
                  <option value="Cashew">{t('crops.cashew')}</option>
                  <option value="Ginger">{t('crops.ginger')}</option>
                  <option value="Turmeric">{t('crops.turmeric')}</option>
                  <option value="Tapioca">{t('crops.tapioca')}</option>
                  <option value="Areca Nut">{t('crops.areca_nut')}</option>
                  <option value="Vanilla">{t('crops.vanilla')}</option>
                  <option value="Cocoa">{t('crops.cocoa')}</option>
                  <option value="Nutmeg">{t('crops.nutmeg')}</option>
                  <option value="Cloves">{t('crops.cloves')}</option>
                  <option value="Cinnamon">{t('crops.cinnamon')}</option>
                  <option value="Jackfruit">{t('crops.jackfruit')}</option>
                  <option value="Mango">{t('crops.mango')}</option>
                  <option value="Papaya">{t('crops.papaya')}</option>
                  <option value="Pineapple">{t('crops.pineapple')}</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!currentLocation || locationLoading}
                className="w-full farm-button px-6 py-4 text-white text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <span>Get My Farm Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Features */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <CloudSun className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">Weather</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">Soil</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600 font-medium">AI Insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;