"use client";
import { useState, useEffect, useRef } from "react";

const LANGUAGES = [
  { id: 'en-IN', label: 'English', icon: '🇺🇸' },
  { id: 'hi-IN', label: 'हिन्दी', icon: '🇮🇳' },
  { id: 'mr-IN', label: 'मराठी', icon: '🚩' }
];

export default function ChatUI() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setMessage(text);
        if (e.results[0].isFinal) sendMessage(text);
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = selectedLang;
  }, [selectedLang]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat]);

const speak = (text: string) => {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = selectedLang;
  const voices = window.speechSynthesis.getVoices();
  const female = voices.find(v => v.lang.startsWith(selectedLang.split('-')[0]) && (v.name.includes("Google") || v.name.includes("Female")));
  if (female) utter.voice = female;
  utter.pitch = 1.1; 
  window.speechSynthesis.speak(utter);
};

const sendMessage = async (val?: string) => {
  const finalMsg = val || message;
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: finalMsg, language: selectedLang }),
  });
  const data = await res.json();
  setChat(p => [...p, { sender: "bot", text: data.reply }]);
  speak(data.reply);
};

  return (
    <div className="w-full max-w-lg bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col h-[75vh] overflow-hidden transition-all duration-500">
      <div className="p-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-2 justify-center">
          {LANGUAGES.map(l => (
            <button 
              key={l.id} 
              onClick={() => setSelectedLang(l.id)} 
              suppressHydrationWarning
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedLang === l.id ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-white/5 border-white/10 text-white/40'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`p-4 rounded-2xl max-w-[85%] text-sm ${msg.sender === "user" ? "bg-cyan-500 text-black font-bold" : "bg-white/10 text-white border border-white/10"}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6">
        <div className="flex gap-3 items-center bg-black/40 p-2 rounded-2xl border border-white/10">
          <input 
            className="flex-1 bg-transparent border-none outline-none text-white px-4 text-sm" 
            value={message} 
            onChange={e => setMessage(e.target.value)} 
            placeholder="Type or use Mic..." 
            suppressHydrationWarning
            onKeyDown={e => e.key === "Enter" && sendMessage()} 
          />
          <button 
            onClick={() => isListening ? recognitionRef.current.stop() : recognitionRef.current.start()} 
            suppressHydrationWarning
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-white/5 text-cyan-400'}`}
          >🎙️</button>
          <button onClick={() => sendMessage()} suppressHydrationWarning className="w-12 h-12 bg-cyan-500 text-black rounded-xl flex items-center justify-center font-bold">➔</button>
        </div>
      </div>
    </div>
  );
}