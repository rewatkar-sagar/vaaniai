"use client";

import { useState, useEffect, useRef } from "react";

type LangCode = "hi-IN" | "mr-IN" | "en-IN";

interface Language {
  id: LangCode;
  label: string;
  icon: string;
}

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

const LANGUAGES: Language[] = [
  { id: "hi-IN", label: "हिन्दी", icon: "🇮🇳" },
  { id: "mr-IN", label: "मराठी", icon: "🚩" },
  { id: "en-IN", label: "English", icon: "🇺🇸" },
];

const Home = () => {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState<LangCode>("hi-IN");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const SR =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SR) return;

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = selectedLang;

    rec.onstart = () => setIsListening(true);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setMessage(text);
      if (e.results[0].isFinal) {
        handleSend(text);
      }
    };
    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
      }
    };
  }, [mounted]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLang;
    }
  }, [selectedLang]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat]);

  const speak = (text: string) => {
    if (typeof window === "undefined") return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = selectedLang;

    const voices = synth.getVoices();
    let voice =
      voices.find(
        (v: any) => v.lang === selectedLang || v.lang.startsWith(selectedLang.split("-")[0])
      ) ||
      voices.find(
        (v: any) =>
          v.name.includes("Google") &&
          (v.lang.includes("hi") || v.lang.includes("mr") || v.lang.includes("en"))
      );

    if (voice) utter.voice = voice;
    utter.rate = 0.9;
    utter.pitch = 1.05;

    synth.speak(utter);
  };

  const handleSend = (raw?: string) => {
    const finalMsg = (raw ?? message).trim();
    if (!finalMsg) return;

    setChat((prev) => [...prev, { sender: "user", text: finalMsg }]);
    setMessage("");

    const langRoot = selectedLang.split("-")[0] as "hi" | "mr" | "en";
    const lower = finalMsg.toLowerCase();
    let reply = "";

    if (lower.includes("email") || lower.includes("ईमेल") || lower.includes("मेल")) {
      const bodyText = finalMsg.replace(/email|ईमेल|मेल/gi, "").trim() || "महत्वपूर्ण जानकारी";

      if (langRoot === "hi") {
        reply = `✨ ईमेल तैयार!\n\n👤 प्रिय बॉस,\n\n📄 ${bodyText}\n\n🙏 धन्यवाद,\nसागर रेवतकर\n📍 नागपुर\n\n✅ "भेजें" बोलिए।`;
      } else if (langRoot === "mr") {
        reply = `✨ ईमेल तयार!\n\n👤 प्रिय बॉस,\n\n📄 ${bodyText}\n\n🙏 धन्यवाद,\nसागर रेवतकर\n📍 नागपूर\n\n✅ "पाठवा" म्हणा.`;
      } else {
        reply = `✨ Email Ready!\n\n👤 Dear Boss,\n\n📄 ${bodyText}\n\n🙏 Thanks,\nSagar Rewatkar\n📍 Nagpur\n\n✅ Say "send".`;
      }
    } else if (lower.includes("send") || lower.includes("भेजें") || lower.includes("पाठवा")) {
      if (langRoot === "hi") reply = "🎉 ईमेल सफलतापूर्वक भेज दिया गया!";
      else if (langRoot === "mr") reply = "🎉 ईमेल यशस्वीरीत्या पाठवला!";
      else reply = "🎉 Email sent successfully!";
    } else if (
      lower.includes("नमस्ते") ||
      lower.includes("namaste") ||
      lower.includes("hello") ||
      lower === "hi"
    ) {
      if (langRoot === "hi") reply = "नमस्ते सागर जी! ✨ कैसे मदद करूँ?\n\n📧 ईमेल लिखें | 🌤️ मौसम | 📞 कॉल";
      else if (langRoot === "mr") reply = "नमस्कार! ✨ काय मदत करू?\n\n📧 ईमेल लिही | 🌤️ हवामान | 📞 कॉल";
      else reply = "Hello Sagar! ✨ How can I help?\n\n📧 Write email | 🌤️ Weather | 📞 Call";
    } else if (lower.includes("weather") || lower.includes("मौसम") || lower.includes("हवामान")) {
      if (langRoot === "hi") reply = "🌤️ नागपुर मौसम\n\n🌡️ 28°C | ☀️ साफ आसमान\n🌬️ हल्की हवा | 👌 बहुत अच्छा";
      else if (langRoot === "mr") reply = "🌤️ नागपूर हवामान\n\n🌡️ 28°C | ☀️ स्वच्छ आकाश\n🌬️ हलकी हवा | 👌 छान";
      else reply = "🌤️ Nagpur Weather\n\n🌡️ 28°C | ☀️ Clear sky\n🌬️ Light breeze | 👌 Perfect";
    } else if (lower.includes("call") || lower.includes("कॉल") || lower.includes("फोन")) {
      if (langRoot === "hi") reply = "📞 कॉल कनेक्ट! (डेमो मोड)\n\n✅ बातचीत शुरू हो गई";
      else if (langRoot === "mr") reply = "📞 कॉल कनेक्ट! (डेमो)\n\n✅ बोलूया सुरू";
      else reply = "📞 Call connected! (Demo)\n\n✅ Conversation started";
    } else {
      if (langRoot === "hi") {
        reply =
          "कमांड्स ट्राई करें:\n\n" +
          "📧 'boss को email लिखो'\n" +
          "📤 'भेजें'\n" +
          "🌤️ 'नागपुर का मौसम'\n" +
          "📞 'सागर को कॉल'";
      } else if (langRoot === "mr") {
        reply =
          "हे कमांड्स:\n\n" +
          "📧 'boss ला email लिही'\n" +
          "📤 'पाठवा'\n" +
          "🌤️ 'नागपूरचं हवामान'\n" +
          "📞 'सागरला कॉल'";
      } else {
        reply =
          "Try these commands:\n\n" +
          "📧 'write email to boss'\n" +
          "📤 'send'\n" +
          "🌤️ 'nagpur weather'\n" +
          "📞 'call sagar'";
      }
    }

    setChat((prev) => [...prev, { sender: "bot", text: reply }]);
    speak(reply);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
        <div className="text-center animate-pulse">
          <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-3xl mx-auto mb-6 shadow-2xl"></div>
          <div className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-orange-600 bg-clip-text text-transparent">
            Loading Vaani AI…
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
      {/* ✨ HERO HEADER */}
      <header className="bg-white/80 backdrop-blur-xl shadow-xl border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl shadow-lg flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 via-orange-600 to-yellow-600 bg-clip-text text-transparent drop-shadow-lg">
                  Vaani AI
                </h1>
                <p className="text-xs font-semibold text-orange-600 tracking-wider uppercase">
                  Nagpur Hackathon 2026 •  
                </p>
              </div>
            </div>
            
            {/* Language Switcher */}
            <div className="flex bg-white/50 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-orange-200">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSelectedLang(lang.id)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all shadow-md flex items-center space-x-2 ${
                    selectedLang === lang.id
                      ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-orange-500/50 scale-105"
                      : "text-gray-700 hover:bg-orange-50 hover:scale-105"
                  }`}
                >
                  <span>{lang.icon}</span>
                  <span className="hidden sm:inline">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ✨ MAIN CHAT */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <div className="bg-white/70 backdrop-blur-2xl shadow-2xl rounded-3xl border border-orange-200/50 h-[75vh] flex flex-col overflow-hidden">
          
          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-white/50 to-orange-50/30">
            {chat.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-28 h-28 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-3xl mx-auto mb-8 shadow-2xl flex items-center justify-center animate-bounce">
                  <span className="text-4xl">🎤</span>
                </div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-gray-800 to-orange-600 bg-clip-text text-transparent mb-4">
                  Vaani AI Ready!
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  माइक दबाकर हिंदी/मराठी बोलिए या टाइप करें
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-orange-100/50 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/30 hover:scale-105 transition-all">
                    <div className="text-2xl mb-2">📧</div>
                    <p className="font-semibold text-gray-800">"boss को email लिखो"</p>
                  </div>
                  <div className="bg-orange-100/50 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/30 hover:scale-105 transition-all">
                    <div className="text-2xl mb-2">🌤️</div>
                    <p className="font-semibold text-gray-800">"नागपुर का मौसम"</p>
                  </div>
                  <div className="bg-orange-100/50 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/30 hover:scale-105 transition-all">
                    <div className="text-2xl mb-2">📞</div>
                    <p className="font-semibold text-gray-800">"सागर को कॉल"</p>
                  </div>
                </div>
              </div>
            ) : (
              chat.map((m, i) => (
                <div
                  key={i}
                  className={`flex animate-in slide-in-from-bottom-2 ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-lg p-6 rounded-3xl shadow-xl backdrop-blur-sm border ${
                      m.sender === "user"
                        ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-orange-300/50"
                        : "bg-white/80 border-gray-200/50"
                    }`}
                  >
                    <div className="whitespace-pre-line text-sm leading-relaxed">
                      {m.text}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isListening && (
              <div className="flex justify-center p-12">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-2xl animate-ping"></div>
                  <div className="w-16 h-16 bg-green-500 rounded-full shadow-2xl absolute inset-2 animate-pulse"></div>
                  <div className="w-12 h-12 bg-green-400 rounded-full shadow-xl absolute inset-4 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">🎤</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-8 bg-white/90 backdrop-blur-xl border-t border-orange-200/30">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <input
                  className="w-full h-16 bg-white/50 backdrop-blur-sm border-2 border-orange-200/50 rounded-3xl px-6 py-4 text-lg font-semibold text-gray-800 placeholder-orange-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-400/30 transition-all shadow-lg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="✨ आपका कमांड यहाँ बोलिए या टाइप कीजिए..."
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-bold shadow-2xl transition-all backdrop-blur-sm border-4 ${
                  isListening
                    ? "bg-gradient-to-r from-red-500 to-rose-500 border-red-400 shadow-red-500/50 hover:scale-110"
                    : "bg-gradient-to-r from-orange-500 to-yellow-500 border-orange-400 shadow-orange-500/50 hover:scale-110"
                }`}
              >
                {isListening ? "⏹" : "🎤"}
              </button>
              <button
                type="button"
                onClick={() => handleSend()}
                className="w-28 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-3xl flex items-center justify-center text-xl font-black text-white shadow-2xl border-4 border-emerald-400 shadow-emerald-500/50 hover:scale-110 transition-all"
              >
                SEND
              </button>
            </div>
            <div className="text-center mt-4 text-xs font-semibold text-orange-600 uppercase tracking-wider">
              Hindi: "boss को email लिखो" | Marathi: "boss ला email लिही" | English: "write email"
            </div>
          </div>
        </div>
      </main>

      {/* Footer - FIXED */}
      <footer className="bg-white/80 backdrop-blur-xl shadow-lg border-t border-orange-100">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <p className="text-sm font-semibold text-gray-600 tracking-wide">
            Made with  by Team Visionaries • Nagpur, Maharashtra 🇮🇳
          </p>
          <p className="text-xs text-orange-500 mt-1 font-bold uppercase tracking-widest">
            Hackathon 2026 
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
