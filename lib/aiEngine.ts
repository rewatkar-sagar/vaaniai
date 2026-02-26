// lib/aiEngine.ts

function getRandomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function generateAIResponse(message: string, sentiment: string, urgency: string, language: string) {
  
  // Strict dictionaries for each language
  const responses: any = {
    "hi-IN": {
      positive: ["यह जानकर बहुत खुशी हुई!", "शानदार!", "बहुत बढ़िया!"],
      neutral: ["ठीक है, मैंने समझ लिया।", "धन्यवाद, आपकी बात नोट कर ली गई है।", "नमस्ते, मैं आपकी सहायता के लिए तैयार हूँ।"],
      angry: ["असुविधा के लिए मुझे खेद है।", "मैं आपकी समस्या समझ सकती हूँ।", "क्षमा करें, हम इसे सुधारेंगे।"],
      joke: "पप्पू: पापा, मुझे एक लड़की पसंद है। पापा: क्या वो भी तुझे पसंद करती है? पप्पू: नहीं, वो तो मुझे जानती भी नहीं!",
      email: "विषय: छुट्टी के लिए आवेदन\n\nआदरणीय महोदय,\nमुझे कल व्यक्तिगत कार्य के लिए छुट्टी चाहिए।\nधन्यवाद।"
    },
    "mr-IN": {
      positive: ["हे ऐकून खूप आनंद झाला!", "उत्तम!", "खूपच छान!"],
      neutral: ["ठीक आहे, मी समजले.", "धन्यवाद, तुमची समस्या नोंदवून घेतली आहे.", "नमस्कार, मी तुमची मदत करू शकते."],
      angry: ["झालेल्या त्रासाबद्दल मी दिलगीर आहे.", "मी तुमची अडचण समजू शकते.", "क्षमस्व, आम्ही यात सुधारणा करू."],
      joke: "शिक्षक: गण्या, शून्याचा शोध कोणी लावला? गण्या: सर, माझ्या बाबांनी, जेव्हा त्यांनी माझा रिझल्ट बघितला!",
      email: "विषय: रजेचा अर्ज\n\nआदरणीय महोदय,\nमला उद्या खाजगी कामासाठी सुट्टी हवी आहे. कृपया रजा मंजूर करावी.\nधन्यवाद।"
    },
    "en-IN": {
      positive: ["Great to hear that!", "That's wonderful!", "Excellent!"],
      neutral: ["I understand.", "Thank you for reaching out.", "Hello, how can I help you today?"],
      angry: ["I apologize for the trouble.", "I understand your frustration.", "Sorry for the inconvenience."],
      joke: "Why don't scientists trust atoms? Because they make up everything!",
      email: "Subject: Leave Application\n\nDear Sir, I need leave for personal work tomorrow. Thanks."
    }
  };

  // 1. FORCE SELECT the correct language dictionary
  const dict = responses[language] || responses["en-IN"];
  const msg = message.toLowerCase();

  // 2. FEATURE LOGIC (Joke or Email)
  if (msg.includes("joke") || msg.includes("विनोद") || msg.includes("चुटकुला")) return dict.joke;
  if (msg.includes("email") || msg.includes("ईमेल") || msg.includes("पत्र")) return dict.email;

  // 3. SENTIMENT LOGIC
  if (sentiment === "positive") return getRandomItem(dict.positive);
  if (sentiment === "angry" || sentiment === "negative") return getRandomItem(dict.angry);
  
  // 4. DEFAULT
  return getRandomItem(dict.neutral);
}