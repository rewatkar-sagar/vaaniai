// lib/sentimentAnalyzer.ts

export type Sentiment = "positive" | "neutral" | "negative";

const positiveKeywords = [
  "good",
  "great",
  "awesome",
  "excellent",
  "happy",
  "love",
  "amazing",
  "thanks",
  "thank you",
];

const negativeKeywords = [
  "bad",
  "terrible",
  "worst",
  "angry",
  "hate",
  "issue",
  "problem",
  "not working",
  "disappointed",
  "sad",
];

export function detectSentiment(message: string): Sentiment {
  const text = message.toLowerCase();

  for (const word of positiveKeywords) {
    if (text.includes(word)) {
      return "positive";
    }
  }

  for (const word of negativeKeywords) {
    if (text.includes(word)) {
      return "negative";
    }
  }

  return "neutral";
}