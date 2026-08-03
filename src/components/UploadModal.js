"use client";

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";

export default function UploadModal({ session, onClose, onComplete }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !scheduledTime) return alert("Please select a video and time.");
    
    setLoading(true);
    try {
      // 1. Upload to Firebase Storage
      const storageRef = ref(storage, `reels/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        (error) => {
          console.error(error);
          alert("Upload failed.");
          setLoading(false);
        },
        async () => {
          // 2. Get public URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // 3. Save to Firestore
          await addDoc(collection(db, "posts"), {
            videoUrl: downloadURL,
            caption,
            scheduledTime: new Date(scheduledTime).toISOString(),
            status: "PENDING",
            accessToken: session.accessToken,
            // Replace this hardcoded ID later if you want to dynamically fetch it
            instagramAccountId: "YOUR_IG_ACCOUNT_ID", 
            createdAt: new Date().toISOString(),
          });

          setLoading(false);
          onComplete();
        }
      );
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Something went wrong");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <h2 style={{ marginBottom: "16px" }}>Schedule New Reel</h2>
        <form onSubmit={handleUpload}>
          <input 
            type="file" 
            accept="video/*" 
            onChange={(e) => setFile(e.target.files[0])} 
            required 
          />
          <textarea 
            placeholder="Write a caption..." 
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          ></textarea>
          <input 
            type="datetime-local" 
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            required
          />
          
          {loading && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                <div style={{ background: "var(--accent-gradient)", height: "100%", width: `${progress}%` }}></div>
              </div>
              <small style={{ color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>
                Uploading... {Math.round(progress)}%
              </small>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
