import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/aiEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, language } = body;

    console.log("API Received:", message, "Lang:", language);

    // Call your engine
    const aiReply = await generateAIResponse(message, "neutral", "normal", language || "en-IN");

    return NextResponse.json({ reply: aiReply });
  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json({ error: "API Failed to process" }, { status: 500 });
  }
}