// lib/aiEngine.ts - HINDI PRIORITY (Namaste = Hindi ALWAYS)
let lastResponse = "";

export async function generateAIResponse(message: string, emotion: string, style: string, language: string): Promise<string> {
  
  const lowerMsg = message.toLowerCase().trim();
  
  // 🔥 FORCE HINDI FOR NAMASTE (Keyword priority #1)
  if (lowerMsg.includes('नमस्ते') || lowerMsg.includes('namaste') || lowerMsg.includes('नमस्कार')) {
    lastResponse = "नमस्ते! कैसे मदद करूँ?";
    return lastResponse;
  }
  
  // 🔄 REPEAT - Hindi if last was Hindi
  if ((lowerMsg.includes('repeat') || lowerMsg.includes('dobara') || lowerMsg.includes("didn't get")) && lastResponse) {
    if (lastResponse.includes('नमस्ते')) {
      return `हाँ जी, दोबारा सुनिए! ${lastResponse}`;
    }
    return `Sure, let me repeat: ${lastResponse}`;
  }
  
  // 👋 ENGLISH GREETING
  if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    lastResponse = "Hello! How can I help you?";
    return lastResponse;
  }
  
  // 💬 DEFAULT
  if (lastResponse.includes('नमस्ते')) {
    return "समझ गया! और क्या मदद चाहिए?";
  }
  return "Got it! What else can I help with?";
}
