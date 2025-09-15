/// <reference path="../types/speech.d.ts" />
import React, { useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Mic, MicOff, Send, Volume2, VolumeX, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001';

type Message = { role: 'user' | 'assistant'; text: string; ts: number };

export const Chat = () => {
  const { t, language, speak } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [roomId] = useState(() => Math.random().toString(36).slice(2));
  const [listening, setListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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
      userId: 'user-' + Math.random().toString(36).slice(2)
    });
  }

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <div className="mx-auto max-w-4xl h-[calc(100vh-2rem)] flex flex-col">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-t-3xl border-b border-green-100 p-4 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">{t('chat.title')}</h1>
              <p className="text-sm text-green-600">{t('chat.subtitle')}</p>
            </div>
          </div>
        </motion.div>

        {/* Messages Container */}
        <div className="flex-1 bg-white/50 backdrop-blur-sm overflow-hidden">
          <div className="h-full overflow-y-auto px-4 sm:px-6 py-4 space-y-4 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-64 text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">{t('chat.welcome_title')}</h3>
                  <p className="text-gray-500 max-w-sm">{t('chat.welcome_text')}</p>
                </motion.div>
              )}

              {messages.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex gap-3 ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  {m.role === 'assistant' && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 mt-2"
                    >
                      <Bot className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                  
                  <div className={`max-w-[75%] sm:max-w-[70%] ${m.role === 'user' ? 'order-2' : ''}`}>
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        m.role === 'assistant' 
                          ? 'bg-white border border-green-100 text-gray-800' 
                          : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
                      <div className={`mt-2 text-xs flex items-center justify-between ${
                        m.role === 'assistant' ? 'text-gray-400' : 'text-white/70'
                      }`}>
                        <span>{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {m.role === 'assistant' && (
                          <div className="flex items-center gap-1">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors" 
                              onClick={() => speak(m.text)} 
                              aria-label="Play TTS"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span className="hidden sm:inline text-xs">{t('chat.play')}</span>
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors" 
                              onClick={stopSpeaking} 
                              aria-label="Stop TTS"
                            >
                              <VolumeX className="w-3 h-3" />
                              <span className="hidden sm:inline text-xs">{t('chat.stop')}</span>
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                  
                  {m.role === 'user' && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 mt-2"
                    >
                      <User className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-green-100 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-b-3xl border-t border-green-100 p-4 sm:p-6"
        >
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.placeholder')}
                className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 outline-none bg-white/70 backdrop-blur-sm transition-all duration-200 text-gray-800 placeholder-gray-500"
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMic}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                listening 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
              }`}
              aria-label="Toggle microphone"
            >
              <motion.div
                animate={listening ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                {listening ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </motion.div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </motion.div>


      </div>
    </div>
  );
};


