import React from 'react';
import { motion } from 'framer-motion';
import { Languages, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ml' : 'en');
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-green-200 rounded-full shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-green-700"
      aria-label={`Switch to ${language === 'en' ? 'Malayalam' : 'English'}`}
      title={`Switch to ${language === 'en' ? 'Malayalam' : 'English'}`}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">
        {language === 'en' ? 'മലയാളം' : 'English'}
      </span>
      <motion.div
        animate={{ rotate: language === 'ml' ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <Languages className="w-4 h-4" />
      </motion.div>
    </motion.button>
  );
};