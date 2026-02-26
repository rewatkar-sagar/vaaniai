import ChatUI from "@/components/ChatUI";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          🎙 VaaniAI
        </h1>
        <p className="text-center text-gray-500 mb-4">
          Emotion-Aware Multilingual Voice Assistant
        </p>
        <ChatUI />
      </div>
    </div>
  );
}