import { NextResponse } from "next/server";
import * as googleTTS from "google-tts-api";

export async function POST(req) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Google TTS API splits long text into multiple audio URLs
    const urls = googleTTS.getAllAudioUrls(text, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.?'
    });
    
    // For simplicity, we just return the first chunk's URL in this MVP
    // In production, the client should fetch all and concatenate, or we do it here
    const audioUrl = urls[0].url;

    // Fetch the audio stream and pass it to the client
    const audioResponse = await fetch(audioUrl);
    const arrayBuffer = await audioResponse.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "attachment; filename=voiceover.mp3"
      }
    });

  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "Failed to generate TTS." }, { status: 500 });
  }
}
