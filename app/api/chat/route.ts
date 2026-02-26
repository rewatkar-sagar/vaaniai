// app/api/chat/route.ts - COMPLETE REPLACE
import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/aiEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, language } = body;
    
    console.log("🎯 API INPUT:", { message, language }); // DEBUG

    const aiReply = await generateAIResponse(message, "neutral", "normal", language);
    
    return NextResponse.json({ reply: aiReply });
  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json({ error: "API Failed" }, { status: 500 });
  }
}
