"use client";

import { useState } from "react";

export default function ChatUI() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);

  const speak = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const detectLanguage = (text: string) => {
    if (/[\u0900-\u097F]/.test(text)) {
      return "hi-IN";
    }
    return "en-IN";
  };

  const sendMessage = async (input?: string) => {
    const finalMessage = input || message;
    if (!finalMessage.trim()) return;

    setChat((prev) => [...prev, { sender: "user", text: finalMessage }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: finalMessage }),
    });

    const data = await res.json();

    setChat((prev) => [
      ...prev,
      { sender: "bot", text: data.reply },
    ]);

    speak(data.reply, detectLanguage(finalMessage));
    setMessage("");
  };

  const startVoice = () => {
    const SpeechRecognition =
      (window as any).speechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript);
    };
  };

  return (
    <>
      <div className="h-80 overflow-y-auto bg-gray-100 p-4 rounded-lg mb-4">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 ${
              msg.sender === "user" ? "text-right" : "text-left"
            }`}
          >
            <span
              className={`inline-block px-4 py-2 rounded-xl ${
                msg.sender === "user"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-300"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded-xl"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type or use voice..."
        />
        <button
          onClick={() => sendMessage()}
          className="bg-indigo-500 text-white px-4 rounded-xl"
        >
          Send
        </button>
        <button
          onClick={startVoice}
          className="bg-green-500 text-white px-4 rounded-xl"
        >
          🎤
        </button>
      </div>
    </>
  );
}