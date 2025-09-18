import React, { useEffect, useState } from 'react';
import { 
  CloudSun, 
  Droplets, 
  Sprout, 
  ThermometerSun, 
  Wind,
  Eye,
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
  RefreshCw,
  ArrowLeft,
  MapPin
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// API endpoints from environment variables
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '895284fb2d2c50a520ea537456963d9c';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBMpDBJrbARtXl7-n9jdu0NX_4oPNNQcc0';

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
  hourly: Array<{
    time: string;
    temperature_c: number;
    humidity: number;
    precip_probability: number;
    wind_speed_kmh: number;
    description: string;
  }>;
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

interface DashboardProps {
  location: LocationData;
  crop: string;
  onBack: () => void;
}

// All the helper functions from the original Home component
const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    console.log('Fetching weather data for:', lat, lon, 'API Key:', OPENWEATHER_API_KEY ? 'Present' : 'Missing');
    
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`)
    ]);

    console.log('Weather API responses:', currentResponse.status, forecastResponse.status);

    if (!currentResponse.ok || !forecastResponse.ok) {
      console.warn('Weather API failed, using fallback data');
      return getFallbackWeatherData(lat, lon);
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    console.log('Weather data fetched successfully:', currentData.name);

    // Process hourly forecast for today (next 8 hours)
    const hourlyForecasts: WeatherData['hourly'] = [];
    const now = new Date();
    
    forecastData.list.slice(0, 8).forEach((item: any) => {
      const itemTime = new Date(item.dt * 1000);
      if (itemTime > now) {
        hourlyForecasts.push({
          time: itemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temperature_c: Math.round(item.main.temp),
          humidity: item.main.humidity,
          precip_probability: Math.round(item.pop * 100),
          wind_speed_kmh: Math.round(item.wind.speed * 3.6),
          description: item.weather[0].description
        });
      }
    });

    // Process forecast data to get daily summaries (6 days excluding today)
    const dailyForecasts: WeatherData['daily'] = [];
    const today = new Date().toISOString().split('T')[0];
    const dailyData: { [key: string]: any[] } = {};
    
    // Group forecast data by date
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (date !== today) {
        if (!dailyData[date]) {
          dailyData[date] = [];
        }
        dailyData[date].push(item);
      }
    });

    // Process each day's data to create daily forecast (limit to 6 days)
    Object.keys(dailyData).slice(0, 6).forEach((date) => {
      const dayData = dailyData[date];
      const temps = dayData.map(item => item.main.temp);
      const humidity = dayData.map(item => item.main.humidity);
      const precipitation = dayData.map(item => item.pop || 0);
      const windSpeeds = dayData.map(item => item.wind.speed * 3.6);
      
      // Get the most frequent weather description for the day
      const descriptions = dayData.map(item => item.weather[0].description);
      const mostFrequentDescription = descriptions.sort((a, b) =>
        descriptions.filter(v => v === a).length - descriptions.filter(v => v === b).length
      ).pop();

      dailyForecasts.push({
        date,
        temp_max_c: Math.round(Math.max(...temps)),
        temp_min_c: Math.round(Math.min(...temps)),
        precip_probability_max: Math.round(Math.max(...precipitation) * 100),
        wind_speed_kmh: Math.round(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length),
        humidity: Math.round(humidity.reduce((a, b) => a + b, 0) / humidity.length),
        description: mostFrequentDescription || 'clear'
      });
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
        precipitation_probability: 0,
        wind_speed_kmh: Math.round(currentData.wind.speed * 3.6),
        wind_direction: getWindDirection(currentData.wind.deg),
        visibility_km: Math.round(currentData.visibility / 1000),
        uv_index: 0,
        feels_like_c: Math.round(currentData.main.feels_like),
        pressure_mb: currentData.main.pressure,
        cloud_cover: currentData.clouds.all,
        description: currentData.weather[0].description
      },
      hourly: hourlyForecasts,
      daily: dailyForecasts
    };
  } catch (error) {
    console.warn('Weather API error, using fallback data:', error);
    return getFallbackWeatherData(lat, lon);
  }
};

// Fallback weather data
const getFallbackWeatherData = (lat: number, lon: number, city: string = 'Unknown Location', country: string = 'Unknown'): WeatherData => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];
  const day3 = new Date(Date.now() + 259200000).toISOString().split('T')[0];
  const day4 = new Date(Date.now() + 345600000).toISOString().split('T')[0];
  const day5 = new Date(Date.now() + 432000000).toISOString().split('T')[0];
  const day6 = new Date(Date.now() + 518400000).toISOString().split('T')[0];

  // Generate hourly forecast for today (next 8 hours)
  const hourlyForecasts = [];
  for (let i = 1; i <= 8; i++) {
    const futureTime = new Date(Date.now() + i * 3600000);
    const temp = 25 + Math.sin(i * 0.5) * 3;
    hourlyForecasts.push({
      time: futureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature_c: Math.round(temp),
      humidity: 65 + Math.cos(i * 0.3) * 10,
      precip_probability: Math.max(0, 20 - i * 2),
      wind_speed_kmh: 12 + Math.sin(i * 0.4) * 5,
      description: i % 3 === 0 ? 'cloudy' : i % 2 === 0 ? 'partly cloudy' : 'clear'
    });
  }

  return {
    location: { latitude: lat, longitude: lon, city, country },
    current: {
      temperature_c: 25,
      relative_humidity: 65,
      precipitation_probability: 20,
      wind_speed_kmh: 12,
      wind_direction: 'NE',
      visibility_km: 10,
      uv_index: 6,
      feels_like_c: 27,
      pressure_mb: 1013,
      cloud_cover: 40,
      description: 'partly cloudy'
    },
    hourly: hourlyForecasts,
    daily: [
      { date: tomorrow, temp_max_c: 28, temp_min_c: 22, precip_probability_max: 20, wind_speed_kmh: 12, humidity: 65, description: 'partly cloudy' },
      { date: dayAfter, temp_max_c: 30, temp_min_c: 24, precip_probability_max: 10, wind_speed_kmh: 15, humidity: 60, description: 'sunny' },
      { date: day3, temp_max_c: 26, temp_min_c: 20, precip_probability_max: 60, wind_speed_kmh: 18, humidity: 75, description: 'light rain' },
      { date: day4, temp_max_c: 29, temp_min_c: 23, precip_probability_max: 15, wind_speed_kmh: 14, humidity: 62, description: 'clear' },
      { date: day5, temp_max_c: 31, temp_min_c: 25, precip_probability_max: 5, wind_speed_kmh: 10, humidity: 58, description: 'sunny' },
      { date: day6, temp_max_c: 27, temp_min_c: 21, precip_probability_max: 40, wind_speed_kmh: 16, humidity: 70, description: 'cloudy' }
    ]
  };
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
      const latFactor = (lat - 20) / 10;
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

// Mock land data
const fetchLandData = async (lat: number, lon: number): Promise<LandData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
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

// AI Recommendation function
const getAIRecommendation = async (weather: WeatherData, soil: SoilData, land: LandData, crop: string, question?: string): Promise<string> => {
  try {
    const prompt = question || `As an expert agricultural advisor, analyze these farming conditions and provide specific recommendations:

LOCATION & WEATHER:
- Location: ${weather.location.city}, ${weather.location.country}
- Current Temperature: ${weather.current.temperature_c}°C (Feels like ${weather.current.feels_like_c}°C)
- Humidity: ${weather.current.relative_humidity}%
- Weather: ${weather.current.description}
- Wind Speed: ${weather.current.wind_speed_kmh} km/h
- Pressure: ${weather.current.pressure_mb} mb
- Visibility: ${weather.current.visibility_km} km

SOIL CONDITIONS:
- Soil Type: ${soil.type}
- pH Level: ${soil.ph}
- Moisture Content: ${soil.moisture}%
- Temperature: ${soil.temperature}°C
- Nitrogen (N): ${soil.nitrogen}%
- Phosphorus (P): ${soil.phosphorus}%
- Potassium (K): ${soil.potassium}%
- Organic Matter: ${soil.organic_matter}%
- Salinity: ${soil.salinity}
- Drainage: ${soil.drainage}

LAND CHARACTERISTICS:
- Elevation: ${land.elevation}m
- Slope: ${land.slope}°
- Aspect: ${land.aspect}
- Land Use: ${land.landUse}
- Irrigation Access: ${land.irrigationAccess ? 'Available' : 'Not Available'}
- Nearest Water Source: ${land.nearestWaterSource} km
- Soil Erosion Risk: ${land.soilErosionRisk}
- Flood Risk: ${land.floodRisk}
- Drought Risk: ${land.droughtRisk}

CROP: ${crop}

Please provide specific, actionable recommendations covering:
1. Current crop management activities
2. Irrigation scheduling and water management
3. Fertilizer/nutrient management
4. Pest and disease monitoring
5. Field operations suitable for current conditions
6. Risk mitigation strategies

Keep recommendations practical and specific to the current conditions and crop type.`;

    console.log('Calling Gemini API for agricultural advice...');
    
    // Make actual Gemini API call
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
    
  } catch (error) {
    console.error('Gemini AI error:', error);
    
    // Fallback to enhanced mock response if API fails
    return `🌾 **AGRICULTURAL ADVISORY FOR ${crop.toUpperCase()}**

📍 **Current Conditions in ${weather.location.city}:**
- Temperature: ${weather.current.temperature_c}°C (${weather.current.description})
- Humidity: ${weather.current.relative_humidity}% | Soil Moisture: ${soil.moisture}%
- Soil pH: ${soil.ph} (${soil.type})

💧 **IRRIGATION RECOMMENDATIONS:**
${soil.moisture < 30 ? '🚨 URGENT: Soil moisture is low. Immediate irrigation required.' : 
  soil.moisture < 50 ? '⚠️ Consider irrigation within 24-48 hours.' : 
  '✅ Soil moisture is adequate. Monitor daily.'}

🌱 **CROP MANAGEMENT:**
- Soil pH of ${soil.ph} is ${soil.ph >= 6.0 && soil.ph <= 7.5 ? 'optimal' : soil.ph < 6.0 ? 'acidic (consider liming)' : 'alkaline (consider sulfur)'}
- NPK levels: N-${soil.nitrogen}%, P-${soil.phosphorus}%, K-${soil.potassium}%
- ${weather.current.temperature_c > 35 ? 'Provide shade protection due to high temperature' : weather.current.temperature_c < 10 ? 'Protect from frost damage' : 'Temperature is suitable for field operations'}

🛡️ **RISK MANAGEMENT:**
- Drought Risk: ${land.droughtRisk} | Flood Risk: ${land.floodRisk}
- ${weather.current.relative_humidity > 80 && weather.current.temperature_c > 25 ? 'Monitor for fungal diseases due to high humidity' : 'Pest monitoring recommended'}

📋 **TODAY'S TASKS:**
- ${weather.current.wind_speed_kmh < 15 ? '✅ Suitable for spraying operations' : '⚠️ High wind - avoid spraying'}
- Field operations: ${weather.current.description.includes('rain') ? 'Postpone field work' : 'Proceed with planned activities'}`;
  }
};

function Dashboard({ location, crop, onBack }: DashboardProps) {
  const { t, language } = useLanguage();
  
  // Helper function to translate soil values
  const translateSoilValue = (value: string, type: 'type' | 'drainage'): string => {
    const translations: Record<string, string> = {
      'Clay Loam': t('soil.clay_loam'),
      'Sandy Loam': t('soil.sandy_loam'),
      'Loamy': t('soil.loamy'),
      'Well-drained': t('soil.well_drained'),
      'Moderately drained': t('soil.moderately_drained')
    };
    return translations[value] || value;
  };
  
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [landData, setLandData] = useState<LandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // AI Advisor state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Load all data when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [weather, soil, land] = await Promise.all([
          fetchWeatherData(location.latitude, location.longitude),
          fetchSoilData(location.latitude, location.longitude),
          fetchLandData(location.latitude, location.longitude)
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

    fetchAllData();
  }, [location]);

  // AI Question Handler
  const handleAIQuestion = async () => {
    if (!weatherData || !soilData || !landData || !aiQuestion.trim()) return;

    setAiLoading(true);
    try {
      const response = await getAIRecommendation(weatherData, soilData, landData, crop, aiQuestion);
      setAiResponse(response);
      setAiQuestion('');
    } catch (error) {
      setAiResponse('Failed to get AI response. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const translateWeatherDescription = (description: string) => {
    const normalizedDesc = description.toLowerCase().trim();
    
    // Exact matches for common weather conditions
    const weatherTranslationMap: { [key: string]: string } = {
      'clear sky': 'weather.clear',
      'few clouds': 'weather.few_clouds',
      'scattered clouds': 'weather.scattered_clouds',
      'broken clouds': 'weather.broken_clouds',
      'overcast clouds': 'weather.overcast',
      'light rain': 'weather.light_rain',
      'moderate rain': 'weather.moderate_rain',
      'heavy rain': 'weather.heavy_rain',
      'thunderstorm': 'weather.thunderstorm',
      'mist': 'weather.mist',
      'fog': 'weather.fog',
    };

    // Check for exact matches first
    if (weatherTranslationMap[normalizedDesc]) {
      return t(weatherTranslationMap[normalizedDesc]);
    }

    // Pattern matching for partial matches
    if (normalizedDesc.includes('rain')) {
      if (normalizedDesc.includes('light')) return t('weather.light_rain');
      if (normalizedDesc.includes('heavy')) return t('weather.heavy_rain');
      return t('weather.moderate_rain');
    }
    
    if (normalizedDesc.includes('cloud')) {
      if (normalizedDesc.includes('few')) return t('weather.few_clouds');
      if (normalizedDesc.includes('scattered')) return t('weather.scattered_clouds');
      if (normalizedDesc.includes('broken')) return t('weather.broken_clouds');
      if (normalizedDesc.includes('overcast')) return t('weather.overcast');
      return t('weather.cloudy');
    }
    
    if (normalizedDesc.includes('clear')) return t('weather.clear');
    if (normalizedDesc.includes('sunny')) return t('weather.sunny');
    if (normalizedDesc.includes('storm')) return t('weather.thunderstorm');
    if (normalizedDesc.includes('mist') || normalizedDesc.includes('fog')) return t('weather.mist');

    // Fallback: return properly capitalized original description
    return description.charAt(0).toUpperCase() + description.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('dashboard.loading_title')}</h2>
          <p className="text-gray-600">{t('dashboard.loading_subtitle')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 p-4 md:p-6">
      <div className="w-4/5 mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('dashboard.back_to_setup')}</span>
          </button>
          
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl">
            <MapPin className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-800">
              {location.city}, {location.country} | {crop}
            </span>
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Your Farm Dashboard
          </h1>
          <p className="text-gray-600">
            Personalized insights for {crop} farming in {location.city}
          </p>
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
              { id: 'overview', label: t('home.overview'), icon: Activity },
              { id: 'weather', label: t('home.weather_details'), icon: CloudSun },
              { id: 'soil', label: t('home.soil_analysis'), icon: Mountain },
              { id: 'ai-advisor', label: t('home.ai_advisor'), icon: Bot }
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
        {activeTab === 'overview' && weatherData && soilData && landData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Weather Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">{t('home.current_weather')}</h3>
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {translateWeatherDescription(weatherData.current.description)}
                </div>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-800 mb-2">
                  {weatherData.current.temperature_c}°C
                </div>
                <div className="text-gray-600">
                  {t('home.feels_like')} {weatherData.current.feels_like_c}°C
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {weatherData.location.city}, {weatherData.location.country}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">{t('home.humidity')}</span>
                  <span className="ml-auto font-semibold">
                    {weatherData.current.relative_humidity}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{t('home.wind_speed')}</span>
                  <span className="ml-auto font-semibold">
                    {weatherData.current.wind_speed_kmh} km/h
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">{t('home.visibility')}</span>
                  <span className="ml-auto font-semibold">
                    {weatherData.current.visibility_km} km
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600">{t('home.pressure')}</span>
                  <span className="ml-auto font-semibold">
                    {weatherData.current.pressure_mb} mb
                  </span>
                </div>
              </div>
            </div>

            {/* Soil Status Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mountain className="w-6 h-6 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-800">{t('home.soil')}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('home.soil_type')}</span>
                  <span className="font-semibold">{translateSoilValue(soilData.type, 'type') || t('common.loading')}</span>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">{t('home.soil_moisture')}</span>
                    <span className="font-semibold">{soilData.moisture}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(soilData.moisture, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">{t('home.soil_ph')}</span>
                    <span className="font-semibold">{soilData.ph}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        soilData.ph >= 6.0 && soilData.ph <= 7.5 ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min((soilData.ph / 14) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-green-600">N</div>
                    <div className="text-gray-600">{soilData.nitrogen}%</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">P</div>
                    <div className="text-gray-600">{soilData.phosphorus}%</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">K</div>
                    <div className="text-gray-600">{soilData.potassium}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Recommendations Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-bold text-gray-800">{t('dashboard.quick_insights')}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-800 mb-1">{t('dashboard.weather_status')}</h4>
                      <p className="text-sm text-green-700">
                        Current conditions are {weatherData.current.temperature_c > 35 ? 'hot' : weatherData.current.temperature_c < 10 ? 'cold' : 'suitable'} for {crop} cultivation.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{t('dashboard.soil_moisture')}</span>
                    <span className={`font-semibold ${soilData.moisture < 40 ? 'text-red-600' : 'text-green-600'}`}>
                      {soilData.moisture < 40 ? 'Low - Irrigation needed' : 'Good'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{t('dashboard.ph_level')}</span>
                    <span className={`font-semibold ${soilData.ph >= 6.0 && soilData.ph <= 7.5 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {soilData.ph >= 6.0 && soilData.ph <= 7.5 ? 'Optimal' : 'Needs attention'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Elevation</span>
                    <span className="font-semibold">{landData.elevation}m</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{t('dashboard.flood_risk')}</span>
                    <span className={`font-semibold ${
                      landData.floodRisk === 'Low' ? 'text-green-600' : 
                      landData.floodRisk === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {landData.floodRisk}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weather Tab */}
        {activeTab === 'weather' && weatherData && (
          <div className="space-y-6">
            {/* Detailed Weather Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ThermometerSun className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{t('home.temperature')}</h4>
                    <p className="text-xs text-gray-500">{t('dashboard.current_conditions')}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {weatherData.current.temperature_c}°C
                </div>
                <p className="text-sm text-gray-600">
                  {t('home.feels_like')} {weatherData.current.feels_like_c}°C
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Droplets className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{t('home.humidity')}</h4>
                    <p className="text-xs text-gray-500">{t('dashboard.relative_humidity')}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {weatherData.current.relative_humidity}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${weatherData.current.relative_humidity}%` }}
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
                  {weatherData.current.wind_speed_kmh} km/h
                </div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  {weatherData.current.wind_direction}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{t('home.pressure')}</h4>
                    <p className="text-xs text-gray-500">{t('dashboard.atmospheric_pressure')}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {weatherData.current.pressure_mb}
                </div>
                <p className="text-sm text-gray-600">mb</p>
              </div>
            </div>

            {/* Hourly Forecast */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-green-600" />
                {t('weather.hourly_forecast')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {weatherData.hourly.map((hour, index) => (
                  <div key={index} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-3 border border-gray-100 text-center">
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      {hour.time}
                    </div>
                    <div className="text-lg font-bold text-gray-800 mb-1">
                      {Math.round(hour.temperature_c)}°
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {translateWeatherDescription(hour.description)}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-blue-600 mb-1">
                      <Droplets className="w-3 h-3" />
                      {Math.round(hour.precip_probability)}%
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                      <Wind className="w-3 h-3" />
                      {Math.round(hour.wind_speed_kmh)} km/h
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6-Day Forecast */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                {t('weather.forecast_6_day')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {weatherData.daily.map((day, index) => {
                  const dayDate = new Date(day.date);
                  const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                  
                  return (
                    <div key={day.date} className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 border border-gray-100">
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-600 mb-2">
                          {dayName}
                        </div>
                        <div className="text-sm font-semibold text-gray-800 mb-2">
                          {translateWeatherDescription(day.description)}
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
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Soil Tab */}
        {activeTab === 'soil' && soilData && landData && (
          <div className="space-y-6">
            {/* Soil Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Mountain className="w-6 h-6 text-amber-600" />
                  {t('soil.composition')}
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">{t('soil.ph_level')}</span>
                      <span className="font-semibold">{soilData.ph}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          soilData.ph >= 6.0 && soilData.ph <= 7.5 
                            ? 'bg-green-500' 
                            : soilData.ph < 6.0 
                              ? 'bg-red-500' 
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min((soilData.ph / 14) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {soilData.ph >= 6.0 && soilData.ph <= 7.5 
                        ? 'Optimal range for most crops'
                        : soilData.ph < 6.0 
                          ? 'Acidic - consider liming'
                          : 'Alkaline - consider sulfur application'}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">{t('soil.moisture_content')}</span>
                      <span className="font-semibold">{soilData.moisture}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          soilData.moisture >= 40 && soilData.moisture <= 70 
                            ? 'bg-blue-500' 
                            : soilData.moisture < 40 
                              ? 'bg-orange-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(soilData.moisture, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {soilData.moisture >= 40 && soilData.moisture <= 70 
                        ? 'Good moisture level'
                        : soilData.moisture < 40 
                          ? 'Low - irrigation needed'
                          : 'High - improve drainage'}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">{t('soil.organic_matter')}</span>
                      <span className="font-semibold">{soilData.organic_matter}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          soilData.organic_matter >= 3 
                            ? 'bg-green-500' 
                            : soilData.organic_matter >= 2 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((soilData.organic_matter / 10) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {soilData.organic_matter >= 3 
                        ? 'Excellent organic content'
                        : soilData.organic_matter >= 2 
                          ? 'Good - add compost'
                          : 'Low - add amendments'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-600" />
                  {t('soil.nutrient_levels')}
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        {t('soil.nitrogen')}
                      </span>
                      <span className="font-semibold">{soilData.nitrogen}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(soilData.nitrogen, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">{t('dashboard.essential_leaf_growth')}</div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        {t('soil.phosphorus')}
                      </span>
                      <span className="font-semibold">{soilData.phosphorus}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(soilData.phosphorus, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">{t('dashboard.important_root_development')}</div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        {t('soil.potassium')}
                      </span>
                      <span className="font-semibold">{soilData.potassium}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(soilData.potassium, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">{t('dashboard.enhances_disease_resistance')}</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-gray-800 mb-2">{t('soil.characteristics')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">{t('soil.type')}:</span>
                      <span className="ml-2 font-semibold">{translateSoilValue(soilData.type, 'type')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('soil.drainage')}:</span>
                      <span className="ml-2 font-semibold">{translateSoilValue(soilData.drainage, 'drainage')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('soil.temperature')}:</span>
                      <span className="ml-2 font-semibold">{soilData.temperature}°C</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('soil.salinity')}:</span>
                      <span className="ml-2 font-semibold">{soilData.salinity} dS/m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Land Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-green-600" />
                {t('soil.land_information')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('soil.elevation')}</span>
                    <span className="font-semibold">{landData.elevation} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('soil.slope')}</span>
                    <span className="font-semibold">{landData.slope}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('soil.aspect')}</span>
                    <span className="font-semibold">{landData.aspect}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('soil.land_use')}</span>
                    <span className="font-semibold">{landData.landUse}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('soil.irrigation_access')}</span>
                    <span className={`font-semibold ${landData.irrigationAccess ? 'text-green-600' : 'text-red-600'}`}>
                      {landData.irrigationAccess ? t('soil.available') : t('soil.not_available')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('soil.water_source')}</span>
                    <span className="font-semibold">{landData.nearestWaterSource} km</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('dashboard.erosion_risk')}</span>
                    <span className={`font-semibold ${
                      landData.soilErosionRisk === 'Low' ? 'text-green-600' : 
                      landData.soilErosionRisk === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {landData.soilErosionRisk}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flood Risk</span>
                    <span className={`font-semibold ${
                      landData.floodRisk === 'Low' ? 'text-green-600' : 
                      landData.floodRisk === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {landData.floodRisk}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('dashboard.drought_risk')}</span>
                    <span className={`font-semibold ${
                      landData.droughtRisk === 'Low' ? 'text-green-600' : 
                      landData.droughtRisk === 'Moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {landData.droughtRisk}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* AI Advisor Tab */}
        {activeTab === 'ai-advisor' && (
          <div className="space-y-6">
            {/* AI Chat Interface */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bot className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">{t('home.ai_agricultural_advisor')}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder={t('home.ask_question')}
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
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-semibold text-gray-800">AI Agricultural Advisor</h4>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {aiResponse.split('\n').filter(line => line.trim()).map((line, index) => {
                            const trimmedLine = line.trim();
                            
                            // Check if line is a header (starts with emojis or has **bold** formatting)
                            const isHeader = /^[🌾🔬🎯📍💧🌱🛡️📋⏰🌊🧪⚡📈💡🗺️🚨]/.test(trimmedLine) || 
                                           trimmedLine.includes('**') || 
                                           (trimmedLine.toUpperCase() === trimmedLine && trimmedLine.length > 5);
                            
                            // Check if line is a bullet point or sub-item
                            const isBulletPoint = trimmedLine.startsWith('-') || 
                                                trimmedLine.startsWith('•') || 
                                                trimmedLine.startsWith('✅') || 
                                                trimmedLine.startsWith('⚠️') || 
                                                trimmedLine.startsWith('🚨') ||
                                                /^\d+\./.test(trimmedLine);
                            
                            // Check if line contains important metrics or values
                            const hasMetrics = /\d+°C|\d+%|\d+\.?\d*\s?(km|m|mb)/.test(trimmedLine);
                            
                            // Check if line is a section divider
                            const isDivider = trimmedLine.startsWith('---') || trimmedLine === '';
                            
                            if (isDivider) {
                              return <div key={index} className="border-t border-gray-200 my-2"></div>;
                            } else if (isHeader) {
                              return (
                                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-white/50 rounded-r-lg">
                                  <h5 className="font-bold text-gray-800 text-base leading-relaxed">
                                    {trimmedLine.replace(/\*\*/g, '')}
                                  </h5>
                                </div>
                              );
                            } else if (isBulletPoint) {
                              return (
                                <div key={index} className="ml-4 pl-4 border-l-2 border-gray-200">
                                  <div className="text-gray-700 text-sm leading-relaxed flex items-start gap-2">
                                    {trimmedLine.startsWith('-') ? (
                                      <>
                                        <span className="text-blue-500 mt-1.5 text-xs">•</span>
                                        <span className="flex-1">{trimmedLine.substring(1).trim()}</span>
                                      </>
                                    ) : trimmedLine.match(/^\d+\./) ? (
                                      <>
                                        <span className="text-blue-600 font-semibold mt-0.5 text-sm">
                                          {trimmedLine.match(/^\d+\./)[0]}
                                        </span>
                                        <span className="flex-1">{trimmedLine.replace(/^\d+\.\s*/, '')}</span>
                                      </>
                                    ) : (
                                      <span className="flex-1">{trimmedLine}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            } else if (hasMetrics) {
                              return (
                                <div key={index} className="bg-white/70 rounded-lg p-3 border border-gray-200">
                                  <p className="text-gray-700 text-sm leading-relaxed font-medium">
                                    {trimmedLine}
                                  </p>
                                </div>
                              );
                            } else {
                              return (
                                <div key={index} className="py-1">
                                  <p className="text-gray-700 text-sm leading-relaxed">
                                    {trimmedLine}
                                  </p>
                                </div>
                              );
                            }
                          })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Generated: {new Date().toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Based on current weather, soil & land conditions
                            </p>
                          </div>
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
                    <div className="font-medium text-gray-800 mb-1">{t('home.irrigation_timing')}</div>
                    <div className="text-sm text-gray-600">{t('home.get_optimal_watering')}</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setAiQuestion("What pests should I watch out for in current conditions?");
                      handleAIQuestion();
                    }}
                    className="p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-800 mb-1">{t('home.pest_management')}</div>
                    <div className="text-sm text-gray-600">{t('home.identify_threats')}</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setAiQuestion("Should I apply fertilizer based on current soil conditions?");
                      handleAIQuestion();
                    }}
                    className="p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-800 mb-1">{t('home.fertilizer_advice')}</div>
                    <div className="text-sm text-gray-600">{t('home.optimize_nutrients')}</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setAiQuestion("What field operations can I safely perform today?");
                      handleAIQuestion();
                    }}
                    className="p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-800 mb-1">{t('home.field_operations')}</div>
                    <div className="text-sm text-gray-600">{t('home.plan_daily_tasks')}</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t('home.todays_insights')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800">{t('home.weather_favorable')}</h4>
                      <p className="text-sm text-green-700 mt-1">
                        {t('home.current_conditions_suitable')}
                      </p>
                    </div>
                  </div>
                  
                  {soilData && soilData.moisture < 40 && (
                    <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-orange-800">Irrigation Needed</h4>
                        <p className="text-sm text-orange-700 mt-1">
                          Soil moisture is at {soilData.moisture}%. Consider watering soon.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {soilData && (soilData.ph < 6.0 || soilData.ph > 7.5) && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800">pH Adjustment Needed</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Current pH: {soilData.ph}. Consider {soilData.ph < 6.0 ? 'liming' : 'sulfur application'}.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800">Growing Conditions</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {crop} cultivation looking good at {location.city} elevation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;