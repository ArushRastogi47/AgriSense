import React, { useEffect, useMemo, useState } from 'react';
import { 
  CloudSun, 
  Droplets, 
  MapPin, 
  Sprout, 
  ThermometerSun, 
  Tractor, 
  Wind,
  Eye,
  Sunrise,
  Sunset,
  Compass,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Leaf,
  Mountain,
  Bot,
  Send,
  Loader2,
  Navigation,
  RefreshCw
} from 'lucide-react';

// Real API endpoints - replace with your actual API keys
const OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY'; // Get from openweathermap.org
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Get from Google AI Studio

type LocationData = {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  state?: string;
  district?: string;
};

type WeatherData = {
  location: LocationData;
  current: {
    temperature_c: number;
    relative_humidity: number;
    precipitation_probability: number;
    wind_speed_kmh: number;
    wind_direction: string;
    visibility_km: number;
    uv_index: number;
    feels_like_c: number;
    pressure_mb: number;
    cloud_cover: number;
    description: string;
  };
  daily: Array<{
    date: string;
    temp_max_c: number;
    temp_min_c: number;
    precip_probability_max: number;
    wind_speed_kmh: number;
    humidity: number;
    description: string;
  }>;
};

type SoilData = {
  ph: number;
  moisture: number;
  temperature: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organic_matter: number;
  salinity: number;
  type: string;
  drainage: string;
};

type LandData = {
  elevation: number;
  slope: number;
  aspect: string;
  landUse: string;
  irrigationAccess: boolean;
  nearestWaterSource: number;
  soilErosionRisk: string;
  floodRisk: string;
  droughtRisk: string;
};

// Get user's current location
const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get location name
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OPENWEATHER_API_KEY}`
          );
          const data = await response.json();
          
          if (data.length > 0) {
            resolve({
              latitude,
              longitude,
              city: data[0].name,
              country: data[0].country,
              state: data[0].state
            });
          } else {
            resolve({
              latitude,
              longitude,
              city: 'Unknown Location',
              country: 'Unknown'
            });
          }
        } catch (error) {
          // Fallback if reverse geocoding fails
          resolve({
            latitude,
            longitude,
            city: 'Unknown Location',
            country: 'Unknown'
          });
        }
      },
      (error) => {
        reject(new Error(`Location access denied: ${error.message}`));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
};

// Fetch weather data using OpenWeatherMap API
const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`)
    ]);

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    // Process forecast data to get daily summaries
    const dailyForecasts: WeatherData['daily'] = [];
    const processedDates = new Set<string>();
    
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!processedDates.has(date) && dailyForecasts.length < 7) {
        processedDates.add(date);
        dailyForecasts.push({
          date,
          temp_max_c: Math.round(item.main.temp_max),
          temp_min_c: Math.round(item.main.temp_min),
          precip_probability_max: item.pop * 100,
          wind_speed_kmh: Math.round(item.wind.speed * 3.6),
          humidity: item.main.humidity,
          description: item.weather[0].description
        });
      }
    });

    return {
      location: {
        latitude: lat,
        longitude: lon,
        city: currentData.name,
        country: currentData.sys.country
      },
      current: {
        temperature_c: Math.round(currentData.main.temp),
        relative_humidity: currentData.main.humidity,
        precipitation_probability: 0, // Current weather doesn't provide this
        wind_speed_kmh: Math.round(currentData.wind.speed * 3.6),
        wind_direction: getWindDirection(currentData.wind.deg),
        visibility_km: Math.round(currentData.visibility / 1000),
        uv_index: 0, // Would need UV Index API
        feels_like_c: Math.round(currentData.main.feels_like),
        pressure_mb: currentData.main.pressure,
        cloud_cover: currentData.clouds.all,
        description: currentData.weather[0].description
      },
      daily: dailyForecasts
    };
  } catch (error) {
    throw new Error('Failed to fetch weather data');
  }
};

// Convert wind degree to direction
const getWindDirection = (deg: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round(deg / 22.5) % 16];
};

// Mock soil data with location-based variations
const fetchSoilData = async (lat: number, lon: number): Promise<SoilData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate soil data variations based on location
      const latFactor = (lat - 20) / 10; // Normalize for Indian subcontinent
      const lonFactor = (lon - 75) / 10;
      
      resolve({
        ph: Math.round((6.5 + latFactor * 0.5) * 10) / 10,
        moisture: Math.round(35 + Math.sin(lonFactor) * 15),
        temperature: Math.round(20 + latFactor * 3),
        nitrogen: Math.round(70 + Math.cos(latFactor) * 20),
        phosphorus: Math.round(60 + Math.sin(lonFactor) * 15),
        potassium: Math.round(75 + latFactor * 10),
        organic_matter: Math.round((2.5 + latFactor * 0.8) * 10) / 10,
        salinity: Math.round((0.5 + Math.abs(lonFactor) * 0.3) * 10) / 10,
        type: latFactor > 0.2 ? 'Clay Loam' : latFactor < -0.2 ? 'Sandy Loam' : 'Loamy',
        drainage: lonFactor > 0.3 ? 'Well-drained' : 'Moderately drained'
      });
    }, 800);
  });
};

// Mock land data with elevation API integration
const fetchLandData = async (lat: number, lon: number): Promise<LandData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate elevation and land characteristics
      const elevation = Math.round(200 + Math.sin(lat * 0.1) * 300 + Math.cos(lon * 0.1) * 200);
      
      resolve({
        elevation,
        slope: Math.round((1 + Math.random() * 4) * 10) / 10,
        aspect: ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'][Math.floor(Math.random() * 8)],
        landUse: 'Agricultural',
        irrigationAccess: Math.random() > 0.3,
        nearestWaterSource: Math.round((0.5 + Math.random() * 3) * 10) / 10,
        soilErosionRisk: elevation > 400 ? 'Moderate' : 'Low',
        floodRisk: elevation < 100 ? 'High' : elevation < 200 ? 'Moderate' : 'Low',
        droughtRisk: ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)]
      });
    }, 600);
  });
};

// AI recommendation using Gemini API
const getAIRecommendation = async (weather: WeatherData, soil: SoilData, land: LandData, crop: string, question?: string): Promise<string> => {
  try {
    const prompt = question || `Based on the following conditions, provide agricultural advice:
    Location: ${weather.location.city}, ${weather.location.country}
    Current Temperature: ${weather.current.temperature_c}°C
    Humidity: ${weather.current.relative_humidity}%
    Soil pH: ${soil.ph}
    Soil Moisture: ${soil.moisture}%
    Soil Type: ${soil.type}
    Crop: ${crop}
    Elevation: ${land.elevation}m
    
    Provide specific recommendations for farming activities, irrigation, pest management, and crop care.`;

    // Note: Replace this with actual Gemini API call
    // const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${GEMINI_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     contents: [{ parts: [{ text: prompt }] }]
    //   })
    // });
    
    // Mock response for demonstration
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = [
          `Based on your location in ${weather.location.city} with current temperature of ${weather.current.temperature_c}°C and ${weather.current.relative_humidity}% humidity, conditions are favorable for ${crop} cultivation. Your soil pH of ${soil.ph} is optimal. Consider irrigation if soil moisture drops below 40%. The ${soil.type} soil provides good drainage. Monitor for pest activity in these conditions.`,
          
          `Weather analysis for ${weather.location.city}: The current conditions with ${weather.current.description} are suitable for field operations. Your ${soil.type} soil at elevation ${land.elevation}m shows good characteristics. For ${crop}, maintain soil moisture around ${soil.moisture}%. Consider nutrient supplementation based on NPK levels: N-${soil.nitrogen}%, P-${soil.phosphorus}%, K-${soil.potassium}%.`,
          
          `Agricultural advisory: With ${weather.current.temperature_c}°C temperature and wind speed of ${weather.current.wind_speed_kmh} km/h, it's suitable for spraying operations if needed. Your soil organic matter of ${soil.organic_matter}% is good for ${crop}. The ${land.droughtRisk.toLowerCase()} drought risk in your area suggests ${land.droughtRisk === 'High' ? 'implementing water conservation measures' : 'continuing current practices'}.`
        ];
        resolve(responses[Math.floor(Math.random() * responses.length)]);
      }, 2000);
    });
  } catch (error) {
    return "Unable to generate AI recommendation at the moment. Please try again later.";
  }
};

function Home() {
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('Wheat');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [landData, setLandData] = useState<LandData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Get user's current location on component mount
  useEffect(() => {
    handleGetCurrentLocation();
  }, []);

  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    setError(null);
    try {
      const locationData = await getCurrentLocation();
      setCurrentLocation(locationData);
      setLocation(`${locationData.city}, ${locationData.country}`);
      await fetchAllData(locationData.latitude, locationData.longitude);
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
      await fetchAllData(fallbackLocation.latitude, fallbackLocation.longitude);
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchAllData = async (lat?: number, lon?: number) => {
    if (!currentLocation && (!lat || !lon)) return;
    
    const latitude = lat || currentLocation!.latitude;
    const longitude = lon || currentLocation!.longitude;
    
    setLoading(true);
    setError(null);
    
    try {
      const [weather, soil, land] = await Promise.all([
        fetchWeatherData(latitude, longitude),
        fetchSoilData(latitude, longitude),
        fetchLandData(latitude, longitude)
      ]);
      
      setWeatherData(weather);
      setSoilData(soil);
      setLandData(land);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAIQuestion = async () => {
    if (!weatherData || !soilData || !landData || !aiQuestion.trim()) return;
    
    setAiLoading(true);
    try {
      const response = await getAIRecommendation(weatherData, soilData, landData, crop, aiQuestion);
      setAiResponse(response);
      setAiQuestion('');
    } catch (err) {
      setAiResponse('Failed to get AI response. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const basicRecommendation = useMemo(() => {
    if (!weatherData || !soilData) return 'Loading recommendations...';
    
    const temp = weatherData.current.temperature_c;
    const humidity = weatherData.current.relative_humidity;
    const soilMoisture = soilData.moisture;
    
    if (soilMoisture < 30) return `Low soil moisture (${soilMoisture}%). Immediate irrigation recommended for ${crop}.`;
    if (temp > 35) return `High temperature (${temp}°C). Provide shade protection and increase watering frequency for ${crop}.`;
    if (temp < 10) return `Low temperature (${temp}°C). Protect ${crop} from frost damage.`;
    if (humidity > 80 && temp > 25) return `High humidity and temperature. Monitor ${crop} for fungal diseases.`;
    
    return `Conditions are favorable for ${crop}. Continue routine care with current practices.`;
  }, [weatherData, soilData, crop]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-green-600 rounded-2xl">
              <Tractor className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Smart Farming Dashboard
            </h1>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            AI-powered agricultural intelligence with real-time weather, soil analysis, and personalized farming recommendations
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location or use current"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                />
                <button
                  onClick={handleGetCurrentLocation}
                  disabled={locationLoading}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  title="Get current location"
                >
                  {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Sprout className="w-4 h-4 inline mr-1" />
                Crop Type
              </label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              >
                <option value="Wheat">Wheat</option>
                <option value="Rice">Rice</option>
                <option value="Corn">Corn</option>
                <option value="Barley">Barley</option>
                <option value="Soybean">Soybean</option>
                <option value="Cotton">Cotton</option>
                <option value="Sugarcane">Sugarcane</option>
                <option value="Potato">Potato</option>
                <option value="Tomato">Tomato</option>
              </select>
            </div>
            
            <button
              onClick={() => currentLocation && fetchAllData()}
              disabled={loading || !currentLocation}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Refresh Data
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'weather', label: 'Weather Details', icon: CloudSun },
              { id: 'soil', label: 'Soil Analysis', icon: Mountain },
              { id: 'ai-advisor', label: 'AI Advisor', icon: Bot }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Weather */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">Current Weather</h3>
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {weatherData?.current.description}
                </div>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-800 mb-2">
                  {loading ? '---' : `${weatherData?.current.temperature_c || '--'}°C`}
                </div>
                <div className="text-gray-600">
                  Feels like {weatherData?.current.feels_like_c || '--'}°C
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {weatherData?.location.city}, {weatherData?.location.country}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">Humidity</span>
                  <span className="ml-auto font-semibold">
                    {loading ? '--' : `${weatherData?.current.relative_humidity || '--'}%`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Wind</span>
                  <span className="ml-auto font-semibold">
                    {loading ? '--' : `${weatherData?.current.wind_speed_kmh || '--'} km/h`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Visibility</span>
                  <span className="ml-auto font-semibold">
                    {loading ? '--' : `${weatherData?.current.visibility_km || '--'} km`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600">Pressure</span>
                  <span className="ml-auto font-semibold">
                    {loading ? '--' : `${weatherData?.current.pressure_mb || '--'} mb`}
                  </span>
                </div>
              </div>
            </div>

            {/* Soil Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mountain className="w-6 h-6 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-800">Soil Status</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Soil Type</span>
                  <span className="font-semibold">{soilData?.type || 'Loading...'}</span>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Moisture</span>
                    <span className="font-semibold">{soilData?.moisture || '--'}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((soilData?.moisture || 0), 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">pH Level</span>
                    <span className="font-semibold">{soilData?.ph || '--'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (soilData?.ph || 0) >= 6.0 && (soilData?.ph || 0) <= 7.5 
                          ? 'bg-green-500' 
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(((soilData?.ph || 0) / 14) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-lg text-blue-600">{soilData?.nitrogen || '--'}</div>
                    <div className="text-gray-500">N</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg text-orange-600">{soilData?.phosphorus || '--'}</div>
                    <div className="text-gray-500">P</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg text-purple-600">{soilData?.potassium || '--'}</div>
                    <div className="text-gray-500">K</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold text-gray-800">Recommendations</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {basicRecommendation}
                    </p>
                  </div>
                </div>
                
                {landData && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Elevation</span>
                      <div className="font-semibold">{landData.elevation}m</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Drainage</span>
                      <div className="font-semibold">{landData.drainage}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Flood Risk</span>
                      <div className={`font-semibold ${
                        landData.floodRisk === 'Low' ? 'text-green-600' : 
                        landData.floodRisk === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {landData.floodRisk}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Drought Risk</span>
                      <div className={`font-semibold ${
                        landData.droughtRisk === 'Low' ? 'text-green-600' : 
                        landData.droughtRisk === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {landData.droughtRisk}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weather' && (
          <div className="space-y-6">
            {/* Detailed Weather Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ThermometerSun className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Temperature</h4>
                    <p className="text-xs text-gray-500">Current conditions</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {weatherData?.current.temperature_c || '--'}°C
                </div>
                <p className="text-sm text-gray-600">
                  Feels like {weatherData?.current.feels_like_c || '--'}°C
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Droplets className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Humidity</h4>
                    <p className="text-xs text-gray-500">Relative humidity</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {weatherData?.current.relative_humidity || '--'}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${weatherData?.current.relative_humidity || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Wind className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Wind</h4>
                    <p className="text-xs text-gray-500">Speed & direction</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {weatherData?.current.wind_speed_kmh || '--'} km/h
                </div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  {weatherData?.current.wind_direction || '--'}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Pressure</h4>
                    <p className="text-xs text-gray-500">Atmospheric pressure</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {weatherData?.current.pressure_mb || '--'}
                </div>
                <p className="text-sm text-gray-600">mb</p>
              </div>
            </div>

            {/* 7-Day Forecast */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                7-Day Weather Forecast
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {(weatherData?.daily || []).map((day, index) => (
                  <div key={day.date} className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 border border-gray-100">
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 mb-2">
                        {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-sm font-semibold text-gray-800 mb-2 capitalize">
                        {day.description}
                      </div>
                      <div className="text-lg font-bold text-gray-800 mb-1">
                        {Math.round(day.temp_max_c)}°
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {Math.round(day.temp_min_c)}°
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs text-blue-600">
                        <Droplets className="w-3 h-3" />
                        {Math.round(day.precip_probability_max)}%
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                        <Wind className="w-3 h-3" />
                        {Math.round(day.wind_speed_kmh)} km/h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'soil' && (
          <div className="space-y-6">
            {/* Soil Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Mountain className="w-6 h-6 text-amber-600" />
                  Soil Composition
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">pH Level</span>
                      <span className="font-semibold">{soilData?.ph || '--'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          (soilData?.ph || 0) >= 6.0 && (soilData?.ph || 0) <= 7.5 
                            ? 'bg-green-500' 
                            : (soilData?.ph || 0) < 6.0 
                              ? 'bg-red-500' 
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(((soilData?.ph || 0) / 14) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {(soilData?.ph || 0) >= 6.0 && (soilData?.ph || 0) <= 7.5 
                        ? 'Optimal range for most crops' 
                        : (soilData?.ph || 0) < 6.0 
                          ? 'Acidic - may need liming' 
                          : 'Alkaline - may need sulfur'}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Moisture Content</span>
                      <span className="font-semibold">{soilData?.moisture || '--'}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          (soilData?.moisture || 0) >= 40 && (soilData?.moisture || 0) <= 70 
                            ? 'bg-blue-500' 
                            : (soilData?.moisture || 0) < 40 
                              ? 'bg-orange-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((soilData?.moisture || 0), 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {(soilData?.moisture || 0) >= 40 && (soilData?.moisture || 0) <= 70 
                        ? 'Good moisture level' 
                        : (soilData?.moisture || 0) < 40 
                          ? 'Low - irrigation needed' 
                          : 'High - check drainage'}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Organic Matter</span>
                      <span className="font-semibold">{soilData?.organic_matter || '--'}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          (soilData?.organic_matter || 0) >= 3 
                            ? 'bg-green-500' 
                            : (soilData?.organic_matter || 0) >= 2 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(((soilData?.organic_matter || 0) / 10) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {(soilData?.organic_matter || 0) >= 3 
                        ? 'Excellent organic content' 
                        : (soilData?.organic_matter || 0) >= 2 
                          ? 'Good - consider compost' 
                          : 'Low - needs organic amendments'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-600" />
                  Nutrient Levels (NPK)
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Nitrogen (N)
                      </span>
                      <span className="font-semibold">{soilData?.nitrogen || '--'}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((soilData?.nitrogen || 0), 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">Essential for leaf growth and chlorophyll</div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        Phosphorus (P)
                      </span>
                      <span className="font-semibold">{soilData?.phosphorus || '--'}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((soilData?.phosphorus || 0), 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">Important for root development and flowering</div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        Potassium (K)
                      </span>
                      <span className="font-semibold">{soilData?.potassium || '--'}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((soilData?.potassium || 0), 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">Enhances disease resistance and fruit quality</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Soil Characteristics</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-semibold">{soilData?.type || '--'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Drainage:</span>
                      <span className="ml-2 font-semibold">{soilData?.drainage || '--'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Temperature:</span>
                      <span className="ml-2 font-semibold">{soilData?.temperature || '--'}°C</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Salinity:</span>
                      <span className="ml-2 font-semibold">{soilData?.salinity || '--'} dS/m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Land Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-green-600" />
                Land Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Elevation</span>
                    <span className="font-semibold">{landData?.elevation || '--'} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slope</span>
                    <span className="font-semibold">{landData?.slope || '--'}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aspect</span>
                    <span className="font-semibold">{landData?.aspect || '--'}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Land Use</span>
                    <span className="font-semibold">{landData?.landUse || '--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Irrigation Access</span>
                    <span className={`font-semibold ${landData?.irrigationAccess ? 'text-green-600' : 'text-red-600'}`}>
                      {landData?.irrigationAccess ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Water Source</span>
                    <span className="font-semibold">{landData?.nearestWaterSource || '--'} km</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Erosion Risk</span>
                    <span className={`font-semibold ${
                      landData?.soilErosionRisk === 'Low' ? 'text-green-600' : 
                      landData?.soilErosionRisk === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {landData?.soilErosionRisk || '--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flood Risk</span>
                    <span className={`font-semibold ${
                      landData?.floodRisk === 'Low' || landData?.floodRisk === 'Minimal' ? 'text-green-600' : 
                      landData?.floodRisk === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {landData?.floodRisk || '--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Drought Risk</span>
                    <span className={`font-semibold ${
                      landData?.droughtRisk === 'Low' ? 'text-green-600' : 
                      landData?.droughtRisk === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {landData?.droughtRisk || '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-advisor' && (
          <div className="space-y-6">
            {/* AI Chat Interface */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bot className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">AI Agricultural Advisor</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask about crop management, pest control, irrigation timing, or any farming question..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && handleAIQuestion()}
                  />
                  <button
                    onClick={handleAIQuestion}
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {aiResponse && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-600 rounded-full">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-2">AI Recommendation</h4>
                        <p className="text-gray-700 leading-relaxed">{aiResponse}</p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          Generated based on current weather, soil, and land conditions
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setAiQuestion("What's the best time to irrigate my crops today?");
                      handleAIQuestion();
                    }}
                    className="p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-800 mb-1">Irrigation Timing</div>
                    <div className="text-sm text-gray-600">Get optimal watering schedule</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setAiQuestion("What pests should I watch out for in current conditions?");
                      handleAIQuestion();
                    }}
                    className="p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-800 mb-1">Pest Management</div>
                    <div className="text-sm text-gray-600">Identify potential threats</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setAiQuestion("Should I apply fertilizer based on current soil conditions?");
                      handleAIQuestion();
                    }}
                    className="p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-800 mb-1">Fertilizer Advice</div>
                    <div className="text-sm text-gray-600">Optimize nutrient application</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setAiQuestion("What field operations can I safely perform today?");
                      handleAIQuestion();
                    }}
                    className="p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-800 mb-1">Field Operations</div>
                    <div className="text-sm text-gray-600">Plan your daily tasks</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Agricultural Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800">Weather Favorable</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Current conditions are suitable for most field operations and crop growth.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <Droplets className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800">Soil Moisture</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Moisture levels at {soilData?.moisture || '--'}% - {
                          (soilData?.moisture || 0) < 40 ? 'irrigation recommended' : 'adequate for now'
                        }.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Monitor Alert</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Keep an eye on {crop} for any signs of stress due to current weather patterns.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-800">Growth Forecast</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Conditions trending positively for {crop} development over the next few days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm border-t border-gray-200 pt-6">
          <p>Smart Farming Dashboard - Empowering farmers with AI-driven agricultural intelligence</p>
          <p className="mt-1">
            Location: {weatherData ? `${weatherData.location.city}, ${weatherData.location.country}` : 'Loading...'} | 
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
export { Home };