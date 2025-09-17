/// <reference path="../types/speech.d.ts" />
import React, { useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Mic, MicOff, Send, Volume2, VolumeX, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageUpload } from './ImageUpload';

const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001';

type Message = { role: 'user' | 'assistant'; text: string; ts: number };

export const Chat = () => {
  const { t, language, speak } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [roomId] = useState(() => Math.random().toString(36).slice(2));
  const [listening, setListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const socket = useMemo(() => io(backendUrl, { transports: ['websocket'] }), []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socket.emit('join', { roomId });
    
    socket.on('assistant_typing', () => {
      setIsTyping(true);
    });
    
    socket.on('user_message', ({ text: t }) => {
      setMessages((m) => [...m, { role: 'user', text: t, ts: Date.now() }]);
    });
    
    socket.on('assistant_message', ({ text: t }) => {
      setIsTyping(false);
      setMessages((m) => [...m, { role: 'assistant', text: t, ts: Date.now() }]);
    });
    
    return () => { 
      socket.disconnect(); 
    };
  }, [roomId, socket]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    
    // Add user message immediately to UI
    setMessages((m) => [...m, { role: 'user', text, ts: Date.now() }]);
    setInput('');
    setIsTyping(true);
    
    // Send message via Socket.IO only
    socket.emit('user_message', {
      roomId,
      text,
      userId: 'user-' + Math.random().toString(36).slice(2),
      language
    });
  }

  const handleImageUpload = (imageData: string, fileName: string) => {
    setIsUploadingImage(true);
    
    // Add user message showing the image upload
    setMessages((m) => [...m, { 
      role: 'user', 
      text: `📸 Uploaded plant image: ${fileName}`, 
      ts: Date.now() 
    }]);
    
    // Send image via Socket.IO
    socket.emit('plant_image_upload', {
      roomId,
      imageData,
      fileName,
      userId: 'user-' + Math.random().toString(36).slice(2),
      language
    });
    
    // Reset upload state after a delay
    setTimeout(() => {
      setIsUploadingImage(false);
    }, 2000);
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  function toggleMic() {
    const SpeechRecognitionCtor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionCtor) {
      alert('SpeechRecognition not supported in this browser');
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognitionCtor();
      recognitionRef.current.lang = language === 'ml' ? 'ml-IN' : 'en-US';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + ' ' : '') + transcript);
      };
      recognitionRef.current.onend = () => setListening(false);
    } else {
      // Update language when it changes
      recognitionRef.current.lang = language === 'ml' ? 'ml-IN' : 'en-US';
    }
    if (!listening) {
      setListening(true);
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
    }
  }

  // Using speak function from LanguageContext for multilingual TTS

  function stopSpeaking() {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 z-0">
        <div className="absolute top-10 left-10 w-32 h-32 text-green-200">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L8 12L12 22L16 12L12 2Z"/>
          </svg>
        </div>
        <div className="absolute top-32 right-20 w-24 h-24 text-yellow-200">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5C14.8 6.1 14.6 5.8 14.3 5.5L16.5 1L14.5 0L12.4 4.8C12.3 4.8 12.2 4.8 12.1 4.8H11.9C11.8 4.8 11.7 4.8 11.6 4.8L9.5 0L7.5 1L9.7 5.5C9.4 5.8 9.2 6.1 9 6.5L3 7V9L9 9.5C9.2 9.9 9.4 10.2 9.7 10.5L7.5 15L9.5 16L11.6 11.2C11.7 11.2 11.8 11.2 11.9 11.2H12.1C12.2 11.2 12.3 11.2 12.4 11.2L14.5 16L16.5 15L14.3 10.5C14.6 10.2 14.8 9.9 15 9.5L21 9Z"/>
          </svg>
        </div>
        <div className="absolute bottom-20 left-32 w-28 h-28 text-green-200">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
          </svg>
        </div>
      </div>
      
      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        <div className="mx-auto max-w-6xl h-full flex flex-col px-4 md:px-6 lg:px-8 py-4 gap-0 overflow-hidden">
          
          {/* Enhanced Header - Fixed */}
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white/90 backdrop-blur-lg rounded-t-3xl border border-white/20 shadow-xl p-4 sm:p-6 lg:p-8 flex-shrink-0 z-30"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.95) 100%)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="relative"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <Bot className="w-7 h-7 text-white relative z-10" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                </motion.div>
                <div className="flex-1">
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 bg-clip-text text-transparent"
                  >
                    {t('chat.title')}
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm sm:text-base text-emerald-600 font-medium"
                  >
                    {t('chat.subtitle')}
                  </motion.p>
                </div>
              </div>
              
              {/* Status Indicator */}
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-700">AI Active</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Enhanced Messages Container */}
          <div className="flex-1 flex flex-col min-h-0 z-20 overflow-hidden">
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 py-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-transparent hover:scrollbar-thumb-emerald-400"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.9) 100%)',
                backdropFilter: 'blur(20px)',
                borderLeft: '1px solid rgba(255,255,255,0.2)',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                marginTop: '0',
                marginBottom: '0',
                maxHeight: '100%',
                height: '100%',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(16, 185, 129, 0.3) transparent'
              }}
            >
              <AnimatePresence initial={false}>
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center justify-center min-h-[400px] text-center px-4 py-8"
                  >
                    {/* Welcome Animation */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                      className="relative mb-6"
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                        <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-white relative z-10" />
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-4 border-transparent border-t-yellow-300 rounded-full"
                        ></motion.div>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full shadow-lg flex items-center justify-center"
                      >
                        <span className="text-xs">🌱</span>
                      </motion.div>
                    </motion.div>

                    <motion.h3 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 bg-clip-text text-transparent mb-3"
                    >
                      {t('chat.welcome_title')}
                    </motion.h3>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-gray-600 max-w-md mb-8 text-base sm:text-lg leading-relaxed"
                    >
                      {t('chat.welcome_text')}
                    </motion.p>
                    
                    {/* Enhanced Plant Disease Feature Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className="bg-gradient-to-br from-emerald-50 via-green-50 to-yellow-50 rounded-2xl p-6 border border-emerald-200/50 max-w-lg w-full shadow-xl backdrop-blur-sm"
                      style={{
                        background: 'linear-gradient(135deg, rgba(240,253,244,0.9) 0%, rgba(254,252,232,0.9) 100%)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                      }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <motion.div 
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg"
                        >
                          <span className="text-white text-xl">🌿</span>
                        </motion.div>
                        <div className="text-left">
                          <h4 className="font-bold text-emerald-800 text-lg">{t('chat.plant_disease_detection')}</h4>
                          <p className="text-emerald-600 text-sm">Powered by AI Vision</p>
                        </div>
                      </div>
                      
                      <p className="text-emerald-700 mb-4 leading-relaxed">
                        {t('chat.plant_disease_description')}
                      </p>
                      
                      <div className="flex items-center justify-center gap-3 text-sm text-emerald-600 bg-emerald-100/50 rounded-xl p-3 border border-emerald-200/50">
                        <motion.span 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-xl"
                        >
                          📸
                        </motion.span>
                        <span className="font-medium">{t('chat.upload_or_capture')}</span>
                      </div>
                    </motion.div>

                    {/* Feature Pills */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="flex flex-wrap justify-center gap-2 mt-6 max-w-md"
                    >
                      {['🎤 Voice Chat', '🌍 Multi-language', '📊 Smart Analysis', '💡 Expert Tips'].map((feature, index) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                          className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-emerald-700 border border-emerald-200/50 shadow-sm"
                        >
                          {feature}
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}

                {messages.map((m, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`flex gap-3 sm:gap-4 ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    {m.role === 'assistant' && (
                      <motion.div 
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative flex-shrink-0 mt-2"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                          <Bot className="w-5 h-5 text-white relative z-10" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                      </motion.div>
                    )}
                    
                    <div className={`max-w-[80%] sm:max-w-[75%] md:max-w-[70%] ${m.role === 'user' ? 'order-2' : ''}`}>
                      <motion.div
                        initial={{ scale: 0.9, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`relative rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg ${
                          m.role === 'assistant' 
                            ? 'bg-white border border-emerald-100/50 text-gray-800' 
                            : 'text-white shadow-xl'
                        }`}
                        style={m.role === 'assistant' ? {
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.95) 100%)',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                        } : {
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.2)'
                        }}
                      >
                        {/* Message tail */}
                        <div className={`absolute top-4 w-3 h-3 transform rotate-45 ${
                          m.role === 'assistant' 
                            ? 'bg-white -left-1.5 border-l border-b border-emerald-100/50' 
                            : 'bg-emerald-500 -right-1.5'
                        }`}></div>
                        
                        <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap relative z-10">{m.text}</div>
                        
                        <div className={`mt-3 text-xs flex items-center justify-between ${
                          m.role === 'assistant' ? 'text-gray-500' : 'text-white/80'
                        }`}>
                          <span className="font-medium">{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {m.role === 'assistant' && (
                            <div className="flex items-center gap-2">
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors p-1 rounded-lg hover:bg-emerald-50" 
                                onClick={() => speak(m.text)} 
                                aria-label="Play TTS"
                              >
                                <Volume2 className="w-4 h-4" />
                                <span className="hidden sm:inline text-xs font-medium">{t('chat.play')}</span>
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50" 
                                onClick={stopSpeaking} 
                                aria-label="Stop TTS"
                              >
                                <VolumeX className="w-4 h-4" />
                                <span className="hidden sm:inline text-xs font-medium">{t('chat.stop')}</span>
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                    
                    {m.role === 'user' && (
                      <motion.div 
                        initial={{ scale: 0, rotate: 90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative flex-shrink-0 mt-2"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                          <User className="w-5 h-5 text-white relative z-10" />
                        </div>
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white"></div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              
                {/* Enhanced Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3 sm:gap-4 justify-start"
                  >
                    <div className="relative flex-shrink-0 mt-2">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        <Bot className="w-5 h-5 text-white relative z-10" />
                      </motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white"
                      ></motion.div>
                    </div>
                    
                    <div 
                      className="bg-white border border-emerald-100/50 rounded-3xl px-6 py-4 shadow-lg max-w-xs"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.95) 100%)',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-emerald-600 text-sm font-medium">AI is thinking...</span>
                      </div>
                      <div className="flex gap-1.5">
                        <motion.div
                          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                          className="w-2.5 h-2.5 bg-emerald-500 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                          className="w-2.5 h-2.5 bg-emerald-500 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                          className="w-2.5 h-2.5 bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Enhanced Input Area - Fixed */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="rounded-b-3xl border-t border-white/20 p-4 sm:p-6 lg:p-8 flex-shrink-0 z-30"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.95) 100%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -8px 10px -6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              marginTop: '0'
            }}
          >
            <div className="flex items-end gap-3 sm:gap-4">
              {/* Enhanced Input Field */}
              <div className="flex-1 relative">
                <motion.input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('chat.placeholder')}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border-2 border-emerald-200/50 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none bg-white/80 backdrop-blur-sm transition-all duration-300 text-gray-800 placeholder-gray-500 text-sm sm:text-base shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  whileFocus={{ scale: 1.02 }}
                />
                {input && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                  />
                )}
              </div>
              
              {/* Enhanced Action Buttons */}
              <div className="flex items-end gap-2 sm:gap-3">
                {/* Image Upload Component */}
                <ImageUpload 
                  onImageUpload={handleImageUpload}
                  isUploading={isUploadingImage}
                />
                
                {/* Voice Input Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleMic}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 relative overflow-hidden ${
                    listening 
                      ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 animate-pulse' 
                      : 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800'
                  }`}
                  style={{
                    boxShadow: listening 
                      ? '0 10px 25px -5px rgba(239, 68, 68, 0.4), 0 8px 10px -6px rgba(239, 68, 68, 0.2)' 
                      : '0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 8px 10px -6px rgba(59, 130, 246, 0.2)'
                  }}
                  aria-label="Toggle microphone"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  <motion.div
                    animate={listening ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="relative z-10"
                  >
                    {listening ? (
                      <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    ) : (
                      <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    )}
                  </motion.div>
                  {listening && (
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 bg-red-400 rounded-2xl"
                    />
                  )}
                </motion.button>
                
                {/* Send Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 disabled:cursor-not-allowed relative overflow-hidden"
                  style={{
                    background: !input.trim() || isTyping 
                      ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                    boxShadow: !input.trim() || isTyping
                      ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      : '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.2)'
                  }}
                  aria-label="Send message"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  <motion.div
                    animate={isTyping ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: isTyping ? Infinity : 0, ease: "linear" }}
                    className="relative z-10"
                  >
                    <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};


