import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set in environment variables." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a viral Instagram Reel strategist for a Gaming and Tech niche.
    List 5 highly engaging, trending topics for a 15-second Reel.
    Format your response as a strict JSON array of strings. Do not include markdown formatting or backticks.
    Example: ["GTA 6 New Leak", "Hidden Minecraft Features", "PS5 Pro Specs Revealed"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Remove markdown code blocks if present
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const topics = JSON.parse(cleanJson);
    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Topics generation error:", error);
    return NextResponse.json({ error: "Failed to generate topics." }, { status: 500 });
  }
}
