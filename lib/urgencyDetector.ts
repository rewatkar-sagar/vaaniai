export function detectUrgency(message: string) {
  const lower = message.toLowerCase();

  const urgentWords = [
    "fraud",
    "blocked",
    "emergency",
    "immediately",
    "urgent",
  ];

  return urgentWords.some(word =>
    lower.includes(word)
  );
}