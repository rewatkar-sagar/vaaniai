export function detectSentiment(message: string) {
  const lower = message.toLowerCase();

  const angryWords = ["angry", "worst", "bad", "complaint"];
  const positiveWords = ["thank", "good", "great", "happy"];

  if (angryWords.some(word => lower.includes(word)))
    return "angry";

  if (positiveWords.some(word => lower.includes(word)))
    return "positive";

  return "neutral";
}