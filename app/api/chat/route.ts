import { NextResponse } from "next/server";
import { detectSentiment } from "@/lib/sentimentAnalyzer";
import { detectUrgency } from "@/lib/urgencyDetector";
import { generateAIResponse } from "@/lib/aiEngine";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message;

    if (!message) {
      return NextResponse.json(
        { error: "Message required" },
        { status: 400 }
      );
    }

    console.log("Incoming:", message);

    const sentiment = detectSentiment(message);
    const urgency = detectUrgency(message);

    console.log("Sentiment:", sentiment);
    console.log("Urgency:", urgency);

    const aiReply = await generateAIResponse(
      message,
      sentiment,
      urgency
    );

    console.log("AI Reply:", aiReply);

    const { error } = await supabase
      .from("conversations")
      .insert([
        {
          user_message: message,
          bot_response: aiReply,
          sentiment,
          urgency,
        },
      ]);

    if (error) {
      console.error("Supabase insert error:", error);
    }

    return NextResponse.json({
      reply: aiReply,
      sentiment,
      urgency,
    });

  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}