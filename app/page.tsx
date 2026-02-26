import ChatUI from "../components/ChatUI";
import VoiceRecorder from "../components/VoiceRecorder";
import { useRef } from "react";

export default function Home() {
  const chatRef = useRef<any>(null);

  const handleVoiceInput = (text: string) => {
    // Call chat input programmatically
    chatRef.current?.addMessage(text); 
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold text-center mb-6">Vaaniai Chat</h1>
        <ChatUI ref={chatRef} />
        <VoiceRecorder onTranscribe={handleVoiceInput} />
      </div>
    </main>
  );
}