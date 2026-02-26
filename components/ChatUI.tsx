"use client";

import { useState } from "react";

export default function ChatUI() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<
    { sender: string; text: string }[]
  >([]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // Add user message
    setChat((prev) => [...prev, { sender: "user", text: message }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    // Add bot reply
    setChat((prev) => [
      ...prev,
      { sender: "bot", text: data.reply },
    ]);

    setMessage("");
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="border p-4 h-96 overflow-y-auto mb-4 bg-gray-100 rounded">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 ${
              msg.sender === "user"
                ? "text-right"
                : "text-left"
            }`}
          >
            <span
              className={`inline-block px-3 py-2 rounded ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex">
        <input
          className="border flex-1 p-2 rounded-l"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-r"
        >
          Send
        </button>
      </div>
    </div>
  );
}