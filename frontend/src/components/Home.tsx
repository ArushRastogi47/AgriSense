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
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    // Check if we're on HTTPS (required for geolocation in modern browsers)
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
          // Reverse geocoding to get location name
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
          
          // Fallback if reverse geocoding fails
          console.log('Reverse geocoding failed, using coordinates only');
          resolve({
            latitude,
            longitude,
            city: 'Unknown Location',
            country: 'Unknown'
          });
        } catch (error) {
          console.warn('Reverse geocoding error:', error);
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

// Fallback weather data
const getFallbackWeatherData = (lat: number, lon: number, city: string = 'Unknown Location', country: string = 'Unknown'): WeatherData => {
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
    daily: [
      { date: new Date().toISOString().split('T')[0], temp_max_c: 28, temp_min_c: 22, precip_probability_max: 20, wind_speed_kmh: 12, humidity: 65, description: 'partly cloudy' },
      { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], temp_max_c: 30, temp_min_c: 24, precip_probability_max: 10, wind_speed_kmh: 15, humidity: 60, description: 'sunny' },
      { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], temp_max_c: 26, temp_min_c: 20, precip_probability_max: 60, wind_speed_kmh: 18, humidity: 75, description: 'light rain' }
    ]
  };
};

// Fetch weather data using OpenWeatherMap API
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
    console.warn('Weather API error, using fallback data:', error);
    return getFallbackWeatherData(lat, lon);
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
    const enhancedResponses = [
      `🌾 **AGRICULTURAL ADVISORY FOR ${crop.toUpperCase()}**

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
- Field operations: ${weather.current.description.includes('rain') ? 'Postpone field work' : 'Proceed with planned activities'}`,

      `🔬 **SOIL & WEATHER ANALYSIS FOR ${crop.toUpperCase()}**

📊 **Soil Health Assessment:**
- Type: ${soil.type} with ${soil.drainage.toLowerCase()} drainage
- Organic Matter: ${soil.organic_matter}% ${soil.organic_matter >= 3 ? '(Excellent)' : soil.organic_matter >= 2 ? '(Good)' : '(Needs improvement)'}
- Salinity: ${soil.salinity} ${soil.salinity < 1 ? '(Low)' : soil.salinity < 2 ? '(Moderate)' : '(High - monitor)'}

🌡️ **Weather Impact Analysis:**
- Current ${weather.current.temperature_c}°C is ${
  crop === 'Rice' ? (weather.current.temperature_c >= 20 && weather.current.temperature_c <= 35 ? 'ideal for rice' : 'monitor stress') :
  crop === 'Coconut' ? (weather.current.temperature_c >= 27 && weather.current.temperature_c <= 35 ? 'perfect for coconut' : 'monitor growth') :
  crop === 'Black Pepper' ? (weather.current.temperature_c >= 23 && weather.current.temperature_c <= 32 ? 'optimal for pepper' : 'adjust care') :
  'suitable for ' + crop.toLowerCase()
}
- Humidity ${weather.current.relative_humidity}% ${weather.current.relative_humidity >= 60 ? 'supports tropical crops' : 'may need irrigation support'}

💡 **SPECIFIC RECOMMENDATIONS:**
${crop === 'Coconut' ? '🥥 Coconut palms need regular watering. Check for button shedding.' :
  crop === 'Black Pepper' ? '🌶️ Ensure proper support structures. Monitor for quick wilt disease.' :
  crop === 'Cardamom' ? '🫚 Maintain 75-85% humidity. Provide shade during hot periods.' :
  crop === 'Rubber' ? '🌳 Optimal tapping conditions. Monitor latex flow.' :
  crop === 'Rice' ? '🌾 Check water levels in fields. Monitor for blast disease.' :
  `🌱 Monitor ${crop.toLowerCase()} for optimal growth conditions.`}

⏰ **TIMING RECOMMENDATIONS:**
- Best watering time: Early morning (6-8 AM) or evening (5-7 PM)
- Fertilizer application: ${soil.moisture > 40 ? 'Now suitable' : 'Wait until after irrigation'}`,

      `🎯 **PRECISION FARMING ADVICE FOR ${crop.toUpperCase()}**

🗺️ **Location Analysis (${weather.location.city}):**
- Elevation: ${land.elevation}m | Slope: ${land.slope}° (${land.slope < 2 ? 'Flat terrain' : land.slope < 5 ? 'Gentle slope' : 'Steep slope'})
- Aspect: ${land.aspect} facing
- Water access: ${land.nearestWaterSource} km to nearest source

🌊 **WATER MANAGEMENT STRATEGY:**
- Current soil moisture: ${soil.moisture}% 
- Irrigation ${land.irrigationAccess ? 'available' : 'not available'} on-site
- ${soil.drainage === 'Well-drained' ? 'Good drainage prevents waterlogging' : 'Monitor for water retention issues'}

🧪 **NUTRIENT OPTIMIZATION:**
- Primary nutrients (NPK): ${soil.nitrogen}-${soil.phosphorus}-${soil.potassium}
- ${soil.nitrogen < 60 ? 'Consider nitrogen supplementation' : 'Nitrogen levels adequate'}
- ${soil.phosphorus < 50 ? 'Phosphorus boost recommended' : 'Phosphorus sufficient'}
- ${soil.potassium < 70 ? 'Potassium application beneficial' : 'Potassium levels good'}

⚡ **IMMEDIATE ACTIONS NEEDED:**
1. ${weather.current.temperature_c > 35 ? 'Provide heat stress protection' : 'Continue normal operations'}
2. ${soil.moisture < 35 ? 'Schedule irrigation within 24 hours' : 'Monitor moisture levels'}
3. ${weather.current.relative_humidity > 85 ? 'Improve air circulation to prevent fungal issues' : 'Humidity levels manageable'}
4. Check for ${crop.includes('Pepper') || crop.includes('Cardamom') ? 'spice-specific pests and diseases' : crop === 'Coconut' ? 'rhinoceros beetle and red palm weevil' : 'common agricultural pests'}

📈 **GROWTH OPTIMIZATION:**
- Weather conditions are ${weather.current.description.includes('clear') || weather.current.description.includes('sunny') ? 'excellent' : weather.current.description.includes('cloud') ? 'good' : 'challenging'} for photosynthesis
- Wind speed ${weather.current.wind_speed_kmh} km/h is ${weather.current.wind_speed_kmh < 10 ? 'calm (good for treatments)' : weather.current.wind_speed_kmh < 20 ? 'moderate (suitable for most operations)' : 'strong (avoid spraying)'}
- Visibility ${weather.current.visibility_km} km indicates ${weather.current.visibility_km > 8 ? 'clear conditions' : 'possible haze or moisture in air'}`
    ];
    
    return enhancedResponses[Math.floor(Math.random() * enhancedResponses.length)];
  }
};

function Home() {
  const { t, language } = useLanguage();
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('Rice');
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

  const [basicRecommendation, setBasicRecommendation] = useState('Loading recommendations...');
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  // Generate AI-powered basic recommendations
  const generateBasicRecommendation = async () => {
    if (!weatherData || !soilData || !landData) {
      setBasicRecommendation('Loading recommendations...');
      return;
    }

    setRecommendationLoading(true);
    try {
      const quickPrompt = `As an agricultural expert, provide a brief 2-3 sentence recommendation for immediate action based on these conditions:

Current Conditions:
- Crop: ${crop}
- Location: ${weatherData.location.city}
- Temperature: ${weatherData.current.temperature_c}°C
- Humidity: ${weatherData.current.relative_humidity}%
- Weather: ${weatherData.current.description}
- Soil Moisture: ${soilData.moisture}%
- Soil pH: ${soilData.ph}
- Soil Type: ${soilData.type}
- Drought Risk: ${landData.droughtRisk}
- Flood Risk: ${landData.floodRisk}

Provide ONE priority action and ONE monitoring advice. Keep it concise and actionable.`;

      console.log('Generating basic AI recommendation...');
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: quickPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 200,
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
          setBasicRecommendation(data.candidates[0].content.parts[0].text);
          return;
        }
      }
    } catch (error) {
      console.error('Basic recommendation AI error:', error);
    }

    // Enhanced fallback recommendations
    const temp = weatherData.current.temperature_c;
    const humidity = weatherData.current.relative_humidity;
    const soilMoisture = soilData.moisture;
    
    let recommendation = '';
    let priority = '';
    let monitoring = '';

    // Priority action based on conditions
    if (soilMoisture < 30) {
      priority = `🚨 URGENT: Soil moisture critically low (${soilMoisture}%). Immediate irrigation required for ${crop}.`;
    } else if (temp > 35) {
      priority = `🌡️ HIGH HEAT: Temperature ${temp}°C. Provide shade protection and increase watering frequency for ${crop}.`;
    } else if (temp < 10) {
      priority = `❄️ FROST RISK: Low temperature ${temp}°C. Protect ${crop} from frost damage immediately.`;
    } else if (humidity > 85 && temp > 25) {
      priority = `🍄 DISEASE RISK: High humidity (${humidity}%) and temperature. Monitor ${crop} for fungal diseases.`;
    } else if (soilData.ph < 5.5 || soilData.ph > 8.0) {
      priority = `⚖️ SOIL pH: pH level ${soilData.ph} needs attention. ${soilData.ph < 5.5 ? 'Apply lime to reduce acidity' : 'Apply sulfur to reduce alkalinity'}.`;
    } else {
      priority = `✅ CONDITIONS FAVORABLE: Current conditions support healthy ${crop} growth.`;
    }

    // Monitoring advice
    if (crop === 'Rice') {
      monitoring = '💧 Monitor water levels in fields and watch for blast disease symptoms.';
    } else if (crop === 'Coconut') {
      monitoring = '🥥 Check for button shedding and rhinoceros beetle activity.';
    } else if (crop === 'Black Pepper') {
      monitoring = '🌶️ Inspect support structures and monitor for quick wilt disease.';
    } else if (crop === 'Cardamom') {
      monitoring = '🫚 Maintain 75-85% humidity and watch for thrips damage.';
    } else if (crop === 'Rubber') {
      monitoring = '🌳 Check latex flow consistency and panel health.';
    } else if (crop === 'Tea') {
      monitoring = '🍃 Monitor for tea mosquito bug and maintain pruning schedule.';
    } else if (crop === 'Coffee') {
      monitoring = '☕ Watch for white stem borer and berry borer activity.';
    } else {
      monitoring = `🔍 Regular monitoring recommended for optimal ${crop.toLowerCase()} health.`;
    }

    recommendation = `${priority} ${monitoring}`;
    setBasicRecommendation(recommendation);
    setRecommendationLoading(false);
  };

  // Generate recommendations when data changes
  useEffect(() => {
    if (weatherData && soilData && landData) {
      generateBasicRecommendation();
    }
  }, [weatherData, soilData, landData, crop]);

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
              {t('home.title')}
            </h1>
          </div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('home.location')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('home.current_location')}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
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
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Sprout className="w-4 h-4 inline mr-1" />
                {t('home.select_crop')}
              </label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              >
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
                <option value="Sugarcane">Sugarcane</option>
                <option value="Sweet Potato">Sweet Potato</option>
                <option value="Yam">Yam</option>
                <option value="Wheat">Wheat</option>
                <option value="Corn">Corn</option>
                <option value="Barley">Barley</option>
                <option value="Soybean">Soybean</option>
                <option value="Cotton">Cotton</option>
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
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {t('home.refresh')}
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Weather */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">{t('home.weather')}</h3>
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
                  {t('home.feels_like')} {weatherData?.current.feels_like_c || '--'}°C
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {weatherData?.location.city}, {weatherData?.location.country}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">{t('home.humidity')}</span>
                  <span className="ml-auto font-semibold">
                    {loading ? '--' : `${weatherData?.current.relative_humidity || '--'}%`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{t('home.wind_speed')}</span>
                  <span className="ml-auto font-semibold">
                    {loading ? '--' : `${weatherData?.current.wind_speed_kmh || '--'} km/h`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">{t('home.visibility')}</span>
                  <span className="ml-auto font-semibold">
                    {loading ? '--' : `${weatherData?.current.visibility_km || '--'} km`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-600">{t('home.pressure')}</span>
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Leaf className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-800">AI Recommendations</h3>
                </div>
                <button
                  onClick={generateBasicRecommendation}
                  disabled={recommendationLoading || !weatherData || !soilData || !landData}
                  className="p-2 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
                  title="Refresh AI recommendations"
                >
                  <RefreshCw className={`w-4 h-4 ${recommendationLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <div className="flex items-start gap-2">
                    {recommendationLoading ? (
                      <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0 animate-spin" />
                    ) : (
                      <Bot className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      {recommendationLoading ? (
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        </div>
                      ) : (
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {basicRecommendation}
                        </p>
                      )}
                      {!recommendationLoading && (
                        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          
                        </div>
                      )}
                    </div>
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
                      <h4 className="font-semibold text-blue-800">{t('home.soil_moisture')}</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {t('home.moisture_levels_at')} {soilData?.moisture || '--'}% - {
                          (soilData?.moisture || 0) < 40 ? t('home.irrigation_recommended') : t('home.adequate_for_now')
                        }.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">{t('home.monitor_alert')}</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        {t('home.keep_eye_on')} {crop} {t('home.stress_due_weather')}.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-800">{t('home.growth_forecast')}</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        {t('home.conditions_trending')} {crop} {t('home.development_next_days')}.
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