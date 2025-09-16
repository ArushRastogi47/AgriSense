import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ml';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  speak: (text: string) => void;
}

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.chat': 'Chat',
    'nav.officer': 'Officer',
    'nav.logout': 'Logout',
    'nav.welcome': 'Welcome',
    
    // Home Page
    'home.title': 'Smart Farming Dashboard',
    'home.subtitle': 'AI-powered agricultural intelligence with real-time weather, soil analysis, and personalized farming recommendations',
    'home.weather': 'Current Weather',
    'home.soil': 'Soil Status',
    'home.crops': 'Crop Management',
    'home.ai_advisor': 'AI Advisor',
    'home.recommendations': 'AI Recommendations',
    'home.refresh': 'Refresh Data',
    'home.location': 'Location',
    'home.temperature': 'Temperature',
    'home.humidity': 'Humidity',
    'home.wind_speed': 'Wind',
    'home.visibility': 'Visibility',
    'home.pressure': 'Pressure',
    'home.feels_like': 'Feels like',
    'home.weather_details': 'Weather Details',
    'home.soil_analysis': 'Soil Analysis',
    'home.daily_forecast': '7-Day Weather Forecast',
    'home.soil_moisture': 'Moisture',
    'home.soil_ph': 'pH Level',
    'home.soil_type': 'Soil Type',
    'home.npk_levels': 'Nutrient Levels (NPK)',
    'home.organic_matter': 'Organic Matter',
    'home.drainage': 'Drainage',
    'home.select_crop': 'Crop Type',
    'home.elevation': 'Elevation',
    'home.flood_risk': 'Flood Risk',
    'home.drought_risk': 'Drought Risk',
    'home.land_info': 'Land Information',
    'home.current_location': 'Get current location',
    'home.overview': 'Overview',
    'home.ai_agricultural_advisor': 'AI Agricultural Advisor',
    'home.ask_question': 'Ask about crop management, pest control, irrigation timing, or any farming question...',
    'home.irrigation_timing': 'Irrigation Timing',
    'home.get_optimal_watering': 'Get optimal watering schedule',
    'home.pest_management': 'Pest Management',
    'home.identify_threats': 'Identify potential threats',
    'home.fertilizer_advice': 'Fertilizer Advice',
    'home.optimize_nutrients': 'Optimize nutrient application',
    'home.field_operations': 'Field Operations',
    'home.plan_daily_tasks': 'Plan your daily tasks',
    'home.todays_insights': "Today's Agricultural Insights",
    'home.powered_by_gemini': 'Powered by Gemini AI',
    'home.last_updated': 'Last updated',
    'home.footer_text': 'Smart Farming Dashboard - Empowering farmers with AI-driven agricultural intelligence',
    
    // Chat
    'chat.title': 'AgriSense AI Assistant',
    'chat.subtitle': 'Your farming companion',
    'chat.welcome_title': 'Welcome to AgriSense!',
    'chat.welcome_text': 'Ask me anything about farming, crops, weather, or agricultural practices. I\'m here to help!',
    'chat.placeholder': 'Ask about crops, weather, markets...',
    'chat.send': 'Send',
    'chat.play': 'Play',
    'chat.stop': 'Stop',
    'chat.listening': 'Listening...',
    'chat.take_photo': 'Take Photo',
    'chat.upload_image': 'Upload Image',
    'chat.analyzing_image': 'Analyzing image...',
    'chat.camera_error': 'Camera requires HTTPS. Use file upload instead.',
    'chat.plant_disease_detection': 'Plant Disease Detection',
    'chat.plant_disease_description': 'Upload or capture a photo of your plant to identify diseases and get AI-powered treatment recommendations.',
    'chat.upload_or_capture': 'Upload from gallery or capture with camera',
    
    // Officer
    'officer.login': 'Officer Login',
    'officer.email': 'Email',
    'officer.password': 'Password',
    'officer.login_btn': 'Login',
    'officer.dashboard': 'Officer Dashboard',
    'officer.total_queries': 'Total Queries',
    'officer.pending_queries': 'Pending Queries',
    'officer.answered_queries': 'Answered Queries',
    'officer.recent_queries': 'Recent Queries',
    
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.continue_guest': 'Continue as Guest',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.forgot_password': 'Forgot Password?',
    'auth.no_account': 'Don\'t have an account?',
    'auth.have_account': 'Already have an account?',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.today': 'Today',
    'common.excellent': 'Excellent',
    'common.good': 'Good',
    'common.moderate': 'Moderate',
    'common.low': 'Low',
    'common.high': 'High',
    'common.optimal': 'Optimal',
    'common.suitable': 'Suitable',
    'common.available': 'Available',
    'common.not_available': 'Not Available',
    
    // Crops (Kerala specific)
    'crops.rice': 'Rice',
    'crops.coconut': 'Coconut',
    'crops.black_pepper': 'Black Pepper',
    'crops.cardamom': 'Cardamom',
    'crops.rubber': 'Rubber',
    'crops.tea': 'Tea',
    'crops.coffee': 'Coffee',
    'crops.banana': 'Banana',
    'crops.cashew': 'Cashew',
    'crops.ginger': 'Ginger',
    'crops.turmeric': 'Turmeric',
    'crops.tapioca': 'Tapioca',
    'crops.areca_nut': 'Areca Nut',
    'crops.vanilla': 'Vanilla',
    'crops.cocoa': 'Cocoa',
    'crops.nutmeg': 'Nutmeg',
    'crops.cloves': 'Cloves',
    'crops.cinnamon': 'Cinnamon',
    'crops.jackfruit': 'Jackfruit',
    'crops.mango': 'Mango',
    'crops.papaya': 'Papaya',
    'crops.pineapple': 'Pineapple',
    
    // Weather & Soil Details
    'home.current_weather': 'Current Weather',
    'home.ph_level': 'pH Level',
    'home.nitrogen': 'Nitrogen',
    'home.phosphorus': 'Phosphorus',
    'home.potassium': 'Potassium',
    'home.moisture_levels_at': 'Moisture levels at',
    'home.irrigation_recommended': 'irrigation recommended',
    'home.adequate_for_now': 'adequate for now',
    'home.monitor_alert': 'Monitor Alert',
    'home.keep_eye_on': 'Keep an eye on',
    'home.stress_due_weather': 'for any signs of stress due to current weather patterns',
    'home.growth_forecast': 'Growth Forecast',
    'home.conditions_trending': 'Conditions trending positively for',
    'home.development_next_days': 'development over the next few days',
    'home.getting_ai_recommendation': 'Getting AI recommendation...',
    'home.chat': 'Chat',
    'home.weather_favorable': 'Weather Favorable',
    'home.current_conditions_suitable': 'Current conditions are suitable for most field operations and crop growth.',
    'home.footer_dashboard': 'Smart Farming Dashboard - Empowering farmers with AI-driven agricultural intelligence',
    'home.location_label': 'Location',
    'home.last_updated_label': 'Last updated',
  },
  
  ml: {
    // Navigation
    'nav.home': 'ഹോം',
    'nav.chat': 'ചാറ്റ്',
    'nav.officer': 'ഓഫീസർ',
    'nav.logout': 'ലോഗൗട്ട്',
    'nav.welcome': 'സ്വാഗതം',
    
    // Home Page
    'home.title': 'സ്മാർട്ട് ഫാർമിംഗ് ഡാഷ്ബോർഡ്',
    'home.subtitle': 'തത്സമയ കാലാവസ്ഥ, മണ്ണ് വിശകലനം, വ്യക്തിഗത കാർഷിക നിർദ്ദേശങ്ങൾ എന്നിവയുള്ള AI-പവർഡ് കാർഷിക ബുദ്ധിമത്ത',
    'home.weather': 'നിലവിലെ കാലാവസ്ഥ',
    'home.soil': 'മണ്ണിന്റെ അവസ്ഥ',
    'home.crops': 'വിള മാനേജ്മെന്റ്',
    'home.ai_advisor': 'AI ഉപദേഷ്ടാവ്',
    'home.recommendations': 'AI നിർദ്ദേശങ്ങൾ',
    'home.refresh': 'ഡാറ്റ പുതുക്കുക',
    'home.location': 'സ്ഥാനം',
    'home.temperature': 'താപനില',
    'home.humidity': 'ഈർപ്പം',
    'home.wind_speed': 'കാറ്റ്',
    'home.visibility': 'ദൃശ്യപരത',
    'home.pressure': 'മർദ്ദം',
    'home.feels_like': 'അനുഭവപ്പെടുന്നത്',
    'home.weather_details': 'കാലാവസ്ഥാ വിവരങ്ങൾ',
    'home.soil_analysis': 'മണ്ണ് വിശകലനം',
    'home.daily_forecast': '7 ദിവസത്തെ കാലാവസ്ഥാ പ്രവചനം',
    'home.soil_moisture': 'ഈർപ്പം',
    'home.soil_ph': 'pH അളവ്',
    'home.soil_type': 'മണ്ണിന്റെ തരം',
    'home.npk_levels': 'പോഷക അളവുകൾ (NPK)',
    'home.organic_matter': 'ജൈവവസ്തു',
    'home.drainage': 'നീർവാരി',
    'home.select_crop': 'വിളയുടെ തരം',
    'home.elevation': 'ഉയരം',
    'home.flood_risk': 'വെള്ളപ്പൊക്ക സാധ്യത',
    'home.drought_risk': 'വരൾച്ച സാധ്യത',
    'home.land_info': 'ഭൂമിയുടെ വിവരങ്ങൾ',
    'home.current_location': 'നിലവിലെ സ്ഥാനം നേടുക',
    'home.overview': 'അവലോകനം',
    'home.ai_agricultural_advisor': 'AI കാർഷിക ഉപദേഷ്ടാവ്',
    'home.ask_question': 'വിള മാനേജ്മെന്റ്, കീട നിയന്ത്രണം, ജലസേചന സമയം അല്ലെങ്കിൽ ഏതെങ്കിലും കാർഷിക ചോദ്യത്തെക്കുറിച്ച് ചോദിക്കുക...',
    'home.irrigation_timing': 'ജലസേചന സമയം',
    'home.get_optimal_watering': 'ഒപ്റ്റിമൽ വാട്ടറിംഗ് ഷെഡ്യൂൾ നേടുക',
    'home.pest_management': 'കീട മാനേജ്മെന്റ്',
    'home.identify_threats': 'സാധ്യമായ ഭീഷണികൾ തിരിച്ചറിയുക',
    'home.fertilizer_advice': 'വളം ഉപദേശം',
    'home.optimize_nutrients': 'പോഷക പ്രയോഗം ഒപ്റ്റിമൈസ് ചെയ്യുക',
    'home.field_operations': 'ഫീൽഡ് ഓപ്പറേഷൻസ്',
    'home.plan_daily_tasks': 'നിങ്ങളുടെ ദൈനംദിന ജോലികൾ ആസൂത്രണം ചെയ്യുക',
    'home.todays_insights': 'ഇന്നത്തെ കാർഷിക വിവേകങ്ങൾ',
    'home.powered_by_gemini': 'Gemini AI പവർഡ്',
    'home.last_updated': 'അവസാനം അപ്ഡേറ്റ് ചെയ്തത്',
    'home.footer_text': 'സ്മാർട്ട് ഫാർമിംഗ് ഡാഷ്ബോർഡ് - AI-ഡ്രിവൻ കാർഷിക ബുദ്ധിമത്തയുള്ള കർഷകരെ ശാക്തീകരിക്കുന്നു',
    
    // Chat
    'chat.title': 'അഗ്രിസെൻസ് AI അസിസ്റ്റന്റ്',
    'chat.subtitle': 'നിങ്ങളുടെ കൃഷി കൂട്ടാളി',
    'chat.welcome_title': 'അഗ്രിസെൻസിലേക്ക് സ്വാഗതം!',
    'chat.welcome_text': 'കൃഷി, വിളകൾ, കാലാവസ്ഥ, അല്ലെങ്കിൽ കാർഷിക രീതികൾ എന്നിവയെക്കുറിച്ച് എന്തെങ്കിലും ചോദിക്കുക. ഞാൻ സഹായിക്കാൻ ഇവിടെയുണ്ട്!',
    'chat.placeholder': 'വിളകൾ, കാലാവസ്ഥ, വിപണികൾ എന്നിവയെക്കുറിച്ച് ചോദിക്കുക...',
    'chat.send': 'അയയ്ക്കുക',
    'chat.play': 'പ്ലേ',
    'chat.stop': 'നിർത്തുക',
    'chat.listening': 'കേൾക്കുന്നു...',
    'chat.take_photo': 'ഫോട്ടോ എടുക്കുക',
    'chat.upload_image': 'ചിത്രം അപ്‌ലോഡ് ചെയ്യുക',
    'chat.analyzing_image': 'ചിത്രം വിശകലനം ചെയ്യുന്നു...',
    'chat.camera_error': 'ക്യാമറയ്ക്ക് HTTPS ആവശ്യമാണ്. പകരം ഫയൽ അപ്‌ലോഡ് ഉപയോഗിക്കുക.',
    'chat.plant_disease_detection': 'സസ്യ രോഗ കണ്ടെത്തൽ',
    'chat.plant_disease_description': 'രോഗങ്ങൾ തിരിച്ചറിയാനും AI-പവർഡ് ചികിത്സാ നിർദ്ദേശങ്ങൾ നേടാനും നിങ്ങളുടെ ചെടിയുടെ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക അല്ലെങ്കിൽ ക്യാപ്‌ചർ ചെയ്യുക.',
    'chat.upload_or_capture': 'ഗാലറിയിൽ നിന്ന് അപ്‌ലോഡ് ചെയ്യുക അല്ലെങ്കിൽ ക്യാമറ ഉപയോഗിച്ച് ക്യാപ്‌ചർ ചെയ്യുക',
    
    // Officer
    'officer.login': 'ഓഫീസർ ലോഗിൻ',
    'officer.email': 'ഇമെയിൽ',
    'officer.password': 'പാസ്‌വേഡ്',
    'officer.login_btn': 'ലോഗിൻ',
    'officer.dashboard': 'ഓഫീസർ ഡാഷ്ബോർഡ്',
    'officer.total_queries': 'മൊത്തം ചോദ്യങ്ങൾ',
    'officer.pending_queries': 'തീർപ്പാക്കാത്ത ചോദ്യങ്ങൾ',
    'officer.answered_queries': 'ഉത്തരം നൽകിയ ചോദ്യങ്ങൾ',
    'officer.recent_queries': 'സമീപകാല ചോദ്യങ്ങൾ',
    
    // Auth
    'auth.login': 'ലോഗിൻ',
    'auth.signup': 'സൈൻ അപ്പ്',
    'auth.continue_guest': 'അതിഥിയായി തുടരുക',
    'auth.email': 'ഇമെയിൽ',
    'auth.password': 'പാസ്‌വേഡ്',
    'auth.confirm_password': 'പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക',
    'auth.forgot_password': 'പാസ്‌വേഡ് മറന്നോ?',
    'auth.no_account': 'അക്കൗണ്ട് ഇല്ലേ?',
    'auth.have_account': 'ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?',
    
    // Common
    'common.loading': 'ലോഡ് ചെയ്യുന്നു...',
    'common.error': 'പിശക്',
    'common.success': 'വിജയം',
    'common.cancel': 'റദ്ദാക്കുക',
    'common.save': 'സേവ്',
    'common.delete': 'ഇല്ലാതാക്കുക',
    'common.edit': 'എഡിറ്റ്',
    'common.view': 'കാണുക',
    'common.close': 'അടയ്ക്കുക',
    'common.today': 'ഇന്ന്',
    'common.excellent': 'മികച്ചത്',
    'common.good': 'നല്ലത്',
    'common.moderate': 'മാദ്ധ്യമം',
    'common.low': 'കുറവ്',
    'common.high': 'ഉയർന്നത്',
    'common.optimal': 'ഒപ്റ്റിമൽ',
    'common.suitable': 'അനുയോജ്യം',
    'common.available': 'ലഭ്യമാണ്',
    'common.not_available': 'ലഭ്യമല്ല',
    
    // Crops (Kerala specific)
    'crops.rice': 'നെല്ല്',
    'crops.coconut': 'തെങ്ങ്',
    'crops.black_pepper': 'കുരുമുളക്',
    'crops.cardamom': 'ഏലം',
    'crops.rubber': 'റബ്ബർ',
    'crops.tea': 'ചായ',
    'crops.coffee': 'കാപ്പി',
    'crops.banana': 'വാഴ',
    'crops.cashew': 'കശുമാവ്',
    'crops.ginger': 'ഇഞ്ചി',
    'crops.turmeric': 'മഞ്ഞൾ',
    'crops.tapioca': 'കപ്പ',
    'crops.areca_nut': 'അടക്ക',
    'crops.vanilla': 'വാനില',
    'crops.cocoa': 'കൊക്കോ',
    'crops.nutmeg': 'ജാതിക്ക',
    'crops.cloves': 'ഗ്രാമ്പൂ',
    'crops.cinnamon': 'കറുവാപ്പട്ട',
    'crops.jackfruit': 'ചക്ക',
    'crops.mango': 'മാങ്ങ',
    'crops.papaya': 'പപ്പായ',
    'crops.pineapple': 'കൈനാപ്പിൾ',
    
    // Weather & Soil Details
    'home.current_weather': 'നിലവിലെ കാലാവസ്ഥ',
    'home.ph_level': 'pH അളവ്',
    'home.nitrogen': 'നൈട്രജൻ',
    'home.phosphorus': 'ഫോസ്ഫറസ്',
    'home.potassium': 'പൊട്ടാസ്യം',
    'home.moisture_levels_at': 'ഈർപ്പം അളവ്',
    'home.irrigation_recommended': 'ജലസേചനം ശുപാർശ ചെയ്യുന്നു',
    'home.adequate_for_now': 'ഇപ്പോൾ മതിയാകും',
    'home.monitor_alert': 'നിരീക്ഷണ മുന്നറിയിപ്പ്',
    'home.keep_eye_on': 'നിരീക്ഷിക്കുക',
    'home.stress_due_weather': 'കാലാവസ്ഥാ വ്യതിയാനങ്ങളുടെ കാരണത്താൽ സമ്മർദ്ദത്തിന്റെ ലക്ഷണങ്ങൾക്കായി',
    'home.growth_forecast': 'വളർച്ചാ പ്രവചനം',
    'home.conditions_trending': 'അനുകൂല സാഹചര്യങ്ങൾ',
    'home.development_next_days': 'അടുത്ത ദിവസങ്ങളിലെ വികസനം',
    'home.getting_ai_recommendation': 'AI നിർദ്ദേശം ലഭിക്കുന്നു...',
    'home.chat': 'ചാറ്റ്',
    'home.weather_favorable': 'കാലാവസ്ഥ അനുകൂലം',
    'home.current_conditions_suitable': 'നിലവിലെ സാഹചര്യങ്ങൾ മിക്ക കാർഷിക പ്രവർത്തനങ്ങൾക്കും വിള വളർച്ചയ്ക്കും അനുയോജ്യമാണ്.',
    'home.footer_dashboard': 'സ്മാർട്ട് ഫാർമിംഗ് ഡാഷ്ബോർഡ് - AI-ഡ്രിവൻ കാർഷിക ബുദ്ധിമത്തയുള്ള കർഷകരെ ശാക്തീകരിക്കുന്നു',
    'home.location_label': 'സ്ഥാനം',
    'home.last_updated_label': 'അവസാനം അപ്ഡേറ്റ് ചെയ്തത്',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('agrisense-language');
    return (saved as Language) || 'en';
  });

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const speak = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (language === 'ml') {
        // Try to find Malayalam voice
        const voices = window.speechSynthesis.getVoices();
        const malayalamVoice = voices.find(voice => 
          voice.lang.includes('ml') || 
          voice.name.toLowerCase().includes('malayalam') ||
          voice.name.toLowerCase().includes('indian') ||
          voice.lang.includes('hi-IN') // Hindi as fallback for Indian languages
        );
        
        if (malayalamVoice) {
          utterance.voice = malayalamVoice;
        }
        utterance.lang = 'ml-IN';
        utterance.rate = 0.7;
        utterance.pitch = 1.1;
      } else {
        utterance.lang = 'en-US';
        utterance.rate = 1;
        utterance.pitch = 1;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  };

  useEffect(() => {
    localStorage.setItem('agrisense-language', language);
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    speak
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};