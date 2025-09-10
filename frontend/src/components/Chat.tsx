/// <reference path="../types/speech.d.ts" />
import React, { useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Mic, MicOff, Send, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8080';

type Message = { role: 'user' | 'assistant'; text: string; ts: number };

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [roomId] = useState(() => Math.random().toString(36).slice(2));
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const socket = useMemo(() => io(backendUrl, { transports: ['websocket'] }), []);

  useEffect(() => {
    socket.emit('join', { roomId });
    socket.on('assistant_typing', () => {});
    socket.on('user_message', ({ text: t }) => {
      setMessages((m) => [...m, { role: 'user', text: t, ts: Date.now() }]);
    });
    socket.on('assistant_message', ({ text: t }) => {
      setMessages((m) => [...m, { role: 'assistant', text: t, ts: Date.now() }]);
    });
    return () => { socket.disconnect(); };
  }, [roomId, socket]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text, ts: Date.now() }]);
    setInput('');
    try {
      const { data } = await axios.post(`${backendUrl}/api/query`, { text, roomId });
      const id = data.id;
      let tries = 0;
      const poll = setInterval(async () => {
        tries += 1;
        const { data: r } = await axios.get(`${backendUrl}/api/response/${id}`);
        if (r.status === 'answered' || tries > 40) {
          clearInterval(poll);
          if (r.response) setMessages((m) => [...m, { role: 'assistant', text: r.response, ts: Date.now() }]);
        }
      }, 1500);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Error sending message.', ts: Date.now() }]);
    }
  }

  function toggleMic() {
    const SpeechRecognitionCtor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionCtor) {
      alert('SpeechRecognition not supported in this browser');
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognitionCtor();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + ' ' : '') + transcript);
      };
      recognitionRef.current.onend = () => setListening(false);
    }
    if (!listening) {
      setListening(true);
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
    }
  }

  function speak(text: string) {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {}
  }

  return (
    <div className="grid place-items-center">
      <div className="w-full max-w-2xl card p-5 sm:p-6 relative">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-brand-light/50 to-transparent" />
        <div className="h-[60vh] sm:h-[56vh] overflow-y-auto space-y-3 pr-1">
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => (
              <motion.div key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex ${m.role==='assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${m.role==='assistant' ? 'bg-white border border-gray-100' : 'bg-brand-green text-white'}`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  <div className={`mt-1 text-[10px] ${m.role==='assistant' ? 'text-gray-400' : 'text-white/80'} flex items-center gap-2`}>
                    <span>{new Date(m.ts).toLocaleTimeString()}</span>
                    {m.role==='assistant' && (
                      <button className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700" onClick={() => speak(m.text)} aria-label="Play TTS">
                        <Volume2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Play</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about crops, weather, markets..."
          />
          <button className="btn !px-3 !py-2" onClick={() => sendMessage(input)} aria-label="Send">
            <Send className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={toggleMic}
          className={`fixed bottom-20 right-6 sm:bottom-8 sm:right-8 rounded-full shadow-lg transition p-4 ${listening ? 'bg-red-500 text-white' : 'bg-brand-green text-white'}`}
          aria-label="Toggle microphone"
        >
          {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};


