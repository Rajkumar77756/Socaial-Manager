"use client";

import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useSession } from "next-auth/react";

export default function AIGenerator() {
  const { data: session } = useSession();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const ffmpegRef = useRef(new FFmpeg());
  const [videoUrl, setVideoUrl] = useState(null);

  const fetchTopics = async () => {
    setLoading(true);
    setStatus("Fetching trending topics...");
    try {
      const res = await fetch("/api/ai/topics");
      const data = await res.json();
      setTopics(data.topics || []);
    } catch (e) {
      console.error(e);
      setStatus("Failed to fetch topics.");
    }
    setLoading(false);
    setStatus("");
  };

  const generateVideo = async (topic) => {
    setLoading(true);
    setStatus("Writing script & hook...");
    try {
      // 1. Get Script
      const scriptRes = await fetch("/api/ai/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const scriptData = await scriptRes.json();
      
      setStatus("Generating AI Voiceover...");
      
      // 2. Get TTS
      const ttsRes = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scriptData.script }),
      });
      const audioBlob = await ttsRes.blob();
      
      setStatus("Loading Video Studio (FFmpeg)...");
      
      // 3. Setup FFmpeg
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg.loaded) {
        await ffmpeg.load(); // Single threaded doesn't need coreURL explicitly if installed properly in nextjs, but let's assume it loads
      }

      setStatus("Rendering Video...");
      
      // 4. Write files to FFmpeg memory
      await ffmpeg.writeFile("voice.mp3", await fetchFile(audioBlob));
      
      // For MVP, we use a static background image or fetch one
      // Since fetching an image cross-origin might fail in canvas/ffmpeg without proxy, we use a solid color or generic local image
      // Let's create a generic video directly from audio using ffmpeg filters!
      
      await ffmpeg.exec([
        "-f", "lavfi", "-i", "color=c=black:s=1080x1920:d=10", // 10 sec black background
        "-i", "voice.mp3",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-shortest",
        "output.mp4"
      ]);

      const data = await ffmpeg.readFile("output.mp4");
      const videoBlob = new Blob([data.buffer], { type: "video/mp4" });
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      
      setStatus("Uploading to Firebase...");
      // Upload to Firebase Storage
      const storageRef = ref(storage, `reels/ai_${Date.now()}.mp4`);
      await uploadBytes(storageRef, videoBlob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      setStatus("Scheduling Post...");
      // Save to Firestore
      await addDoc(collection(db, "posts"), {
        videoUrl: downloadUrl,
        caption: scriptData.caption,
        status: "PENDING",
        accessToken: session.accessToken,
        instagramAccountId: "YOUR_IG_ACCOUNT_ID", 
        createdAt: new Date().toISOString(),
        scheduledTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
      });

      setStatus("Done! Video Scheduled.");
      
    } catch (e) {
      console.error(e);
      setStatus("Error generating video: " + e.message);
    }
    setLoading(false);
  };

  if (!session) return null;

  return (
    <div className="card" style={{ marginTop: "24px" }}>
      <h2>AI Content Studio</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
        Auto-generate viral scripts, voiceovers, and videos entirely in your browser.
      </p>
      
      {!topics.length ? (
        <button className="btn-primary" onClick={fetchTopics} disabled={loading} style={{ width: "100%" }}>
          {loading ? "Loading..." : "Get Trending Gaming Topics"}
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {topics.map((topic, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
              <span style={{ fontWeight: "500" }}>{topic}</span>
              <button className="btn-primary" onClick={() => generateVideo(topic)} disabled={loading} style={{ padding: "8px 16px", fontSize: "14px" }}>
                Generate
              </button>
            </div>
          ))}
        </div>
      )}

      {status && (
        <div style={{ marginTop: "16px", padding: "12px", background: "rgba(255,255,255,0.1)", borderRadius: "8px", textAlign: "center" }}>
          <p>{status}</p>
        </div>
      )}
      
      {videoUrl && (
        <div style={{ marginTop: "16px" }}>
          <h3>Preview:</h3>
          <video src={videoUrl} controls style={{ width: "100%", borderRadius: "8px", marginTop: "8px" }} />
        </div>
      )}
    </div>
  );
}
