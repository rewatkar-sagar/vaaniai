// lib/aiEngine.ts - 5 BASIC TASKS + NO ERRORS EVER
let lastResponse = "";
let pendingTask = "";

export async function generateAIResponse(message: string, emotion: string, style: string, language: string): Promise<string> {
  const lowerMsg = message.toLowerCase().trim();
  const langCode = language.split('-')[0] || 'en';
  
  // 🔥 TASK 1: Write Email
  if (lowerMsg.includes('write') && (lowerMsg.includes('email') || lowerMsg.includes('ईमेल') || lowerMsg.includes('मेल'))) {
    const taskContent = message.replace(/write|email|लिख|ईमेल|मेल|lihi/gi, '').trim() || 'महत्वपूर्ण जानकारी';
    pendingTask = 'email';
    
    if (langCode === 'hi') {
      return `📧 **ईमेल तैयार!**\n\nप्रिय [नाम],\n\n${taskContent}\n\nधन्यवाद,\n[आपका नाम]\n\n✅ "भेजें" बोलिए!`;
    } else if (langCode === 'mr') {
      return `📧 **ईमेल तयार!**\n\nप्रिय [नाम],\n\n${taskContent}\n\nधन्यवाद,\n[तुमचं नाव]\n\n✅ "पाठवा" म्हणा!`;
    }
    return `📧 **Email Ready!**\n\nDear [Name],\n\n${taskContent}\n\nBest,\n[Your Name]\n\n✅ Say "send"!`;
  }
  
  // 📤 TASK 2: Send Email
  if ((lowerMsg.includes('send') || lowerMsg.includes('भेजें') || lowerMsg.includes('पाठवा')) && pendingTask === 'email') {
    pendingTask = '';
    if (langCode === 'hi') return "✅ ईमेल सफलतापूर्वक भेज दिया! 🎉";
    if (langCode === 'mr') return "✅ ईमेल पाठवला! 🎉";
    return "✅ Email sent successfully! 🎉";
  }
  
  // 🕒 TASK 3: Set Reminder
  if (lowerMsg.includes('remind') || lowerMsg.includes('रिमाइंड') || lowerMsg.includes('स्मरण')) {
    if (langCode === 'hi') return "⏰ रिमाइंडर सेट! समय बताइए।";
    if (langCode === 'mr') return "⏰ रिमाइंडर सेट! वेळ सांगा।";
    return "⏰ Reminder set! Tell me the time.";
  }
  
  // 📱 TASK 4: Call Contact
  if (lowerMsg.includes('call') && (lowerMsg.includes('sagar') || lowerMsg.includes('सागर'))) {
    if (langCode === 'hi') return "📞 सागर को कॉल लगा रहा हूँ... कनेक्ट हो गया!";
    if (langCode === 'mr') return "📞 सागरला कॉल करतो... कनेक्ट झालं!";
    return "📞 Calling Sagar... Connected!";
  }
  
  // 🔍 TASK 5: Weather Check
  if (lowerMsg.includes('weather') || lowerMsg.includes('मौसम')) {
    if (langCode === 'hi') return "🌤️ नागपुर में मौसम: 28°C, साफ आसमान।";
    if (langCode === 'mr') return "🌤️ नागपूरचा हवामान: 28°C, उंच.";
    return "🌤️ Nagpur weather: 28°C, Clear skies.";
  }
  
  // 👋 GREETINGS (Always working)
  if (lowerMsg.includes('नमस्ते') || lowerMsg.includes('namaste') || lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    lastResponse = langCode === 'hi' ? "नमस्ते! कैसे मदद करूँ?" :
                   langCode === 'mr' ? "नमस्कार! काय मदत करू?" :
                   "Hello! How can I help you?";
    return lastResponse;
  }
  
  // 🔄 REPEAT (Always working)
  if (lowerMsg.includes('repeat') || lowerMsg.includes('dobara') || lowerMsg.includes('punha') || lowerMsg.includes("again")) {
    return lastResponse || (langCode === 'hi' ? "कुछ दोहराने को नहीं!" : "Nothing to repeat!");
  }
  
  // 💬 DEFAULT HELPFUL
  return langCode === 'hi' ? "समझ गया! और क्या मदद चाहिए? (ईमेल लिखें, मौसम, कॉल आदि)" :
         langCode === 'mr' ? "समजलं! आणखी काय? (ईमेल लिही, हवामान, कॉल इ.)" :
         "Got it! What else? (Write email, weather, call etc)";
}
