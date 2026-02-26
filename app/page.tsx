import ChatUI from "../components/ChatUI";

export default function Home() {
  return (
    <main className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold text-center mb-6">Vaaniai Chat</h1>
        <ChatUI />
      </div>
    </main>
  );
}