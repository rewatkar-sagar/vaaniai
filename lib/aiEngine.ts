// lib/aiEngine.ts

function getRandomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function generateAIResponse(
  message: string,
  sentiment: string,
  urgency: boolean
) {
  const neutralResponses = [
    "Thank you for reaching out.",
    "We appreciate you contacting us.",
    "Thanks for bringing this to our attention.",
    "I understand your concern."
  ];

  const positiveResponses = [
    "We’re happy to hear that!",
    "That’s wonderful to know!",
    "We truly appreciate your positive feedback!",
    "It’s great to hear such positivity from you!"
  ];

  const angryResponses = [
    "I sincerely apologize for the inconvenience caused.",
    "We deeply regret the trouble you’ve faced.",
    "I understand your frustration.",
    "We are truly sorry for the unpleasant experience."
  ];

  const urgencyAddons = [
    "This will be treated with the highest priority.",
    "Our team is escalating this immediately.",
    "We are marking this as urgent.",
    "This has been flagged for immediate resolution."
  ];

  const supportiveClosings = [
    "Please let us know if there’s anything else we can assist with.",
    "We’re here to help you at every step.",
    "Feel free to reach out again anytime.",
    "Your satisfaction is important to us."
  ];

  let base = "";

  if (sentiment === "positive") {
    base = getRandomItem(positiveResponses);
  } else if (sentiment === "angry" || sentiment === "negative") {
    base = getRandomItem(angryResponses);
  } else {
    base = getRandomItem(neutralResponses);
  }

  let urgencyLine = "";
  if (urgency) {
    urgencyLine = " " + getRandomItem(urgencyAddons);
  }

  const closing = " " + getRandomItem(supportiveClosings);

  return base + urgencyLine + closing;
}