import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const payload = await req.json();
    
    // We send the webhook to Make.com
    const webhookUrl = "https://hook.eu1.make.com/jh8u8el3txw9wn8wksprj9u2bbssw63w";
    const apiKey = "Rajrohit123#"; // In production, move to process.env.MAKE_API_KEY

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-make-api-key": apiKey, // Custom header for Make.com authentication
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Make.com responded with status ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Failed to send webhook to Make.com" }, { status: 500 });
  }
}
