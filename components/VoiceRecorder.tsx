"use client";

import { useEffect, useState } from "react";

interface VoiceRecorderProps {
  onTranscribe: (text: string) => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
  interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: any) => void;
    start: () => void;
    stop: () => void;
  }
}

export default function VoiceRecorder({ onTranscribe }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const recog = new (window as any).webkitSpeechRecognition() as SpeechRecognition;
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = "en-US";

    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscribe(transcript);
    };

    setRecognition(recog);
  }, []);

  const startRecording = () => {
    if (!recognition) return;
    setRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    if (!recognition) return;
    setRecording(false);
    recognition.stop();
  };

  return (
    <div className="flex gap-2 mt-2">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded text-white ${recording ? "bg-red-500" : "bg-green-500"}`}
      >
        {recording ? "Stop" : "Record"}
      </button>
    </div>
  );
}