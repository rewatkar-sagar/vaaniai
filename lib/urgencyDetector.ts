// lib/urgencyDetector.ts

const urgentKeywords = [
  "urgent",
  "immediately",
  "asap",
  "right now",
  "emergency",
  "important",
  "critical",
  "now",
  "fast",
];

export function detectUrgency(message: string): boolean {
  const text = message.toLowerCase();

  return urgentKeywords.some((word) => text.includes(word));
}