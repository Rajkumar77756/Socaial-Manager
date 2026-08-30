import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { topic } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set in environment variables." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a viral TikTok/Reels scriptwriter. The topic is: "${topic}".
    Write a 3-sentence script that is maximum 15 seconds long when spoken.
    
    RULES:
    1. The first sentence MUST be a shocking or controversial hook.
    2. Keep the script conversational, fast-paced, and engaging (like a human creator).
    3. Do not include any stage directions, emojis, or hashtags in the script text. Just the spoken words.
    4. Write a 300-500 word SEO-optimized blog post on this same topic for a Blogger website. Use a highly engaging, human-like, non-robotic tone (use slang, emotion, formatting).
    
    Format your response as a strict JSON object with this shape:
    {
      "script": "The actual spoken text...",
      "caption": "A catchy caption for the post including 5 niche hashtags",
      "blogPost": "The 300-500 word human-like blog post formatted in HTML (use <h2>, <p>, <strong> etc)",
      "imagePrompt": "A single sentence describing an image to use as the background (e.g., 'a futuristic gaming controller on a neon desk')"
    }
    
    Return ONLY valid JSON. No backticks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanJson);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Script generation error:", error);
    return NextResponse.json({ error: "Failed to generate script." }, { status: 500 });
  }
}
