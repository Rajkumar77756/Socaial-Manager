"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LogOut, Plus, RefreshCw, CalendarClock, Play } from "lucide-react";
import UploadModal from "@/components/UploadModal";
import AIGenerator from "@/components/AIGenerator";

export default function Home() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    
    const q = query(collection(db, "posts"), orderBy("scheduledTime", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [status]);

  if (status === "loading") {
    return <div className="container" style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="container" style={{ textAlign: "center", marginTop: "100px", maxWidth: "600px" }}>
        <div className="glass-panel">
          <h1 className="gradient-text" style={{ fontSize: "42px", marginBottom: "16px" }}>IG Auto Scheduler</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "18px" }}>
            Automate your Instagram Reels publishing.
          </p>
          <button className="btn-primary" onClick={() => signIn("facebook")} style={{ width: "100%", padding: "16px" }}>
            Login with Facebook
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div>
          <h1 className="gradient-text">Dashboard</h1>
          <p style={{ color: "var(--text-secondary)" }}>Welcome, {session.user.name}</p>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Schedule Reel</button>
          <button className="btn-secondary" onClick={() => signOut()}>Logout</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
        {posts.map((post) => (
          <div key={post.id} className="glass-panel">
            <h3 style={{ marginBottom: "8px" }}>{new Date(post.scheduledTime).toLocaleString()}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
              {post.caption || "No caption"}
            </p>
            <span style={{ 
              display: "inline-block", 
              padding: "4px 12px", 
              borderRadius: "20px", 
              fontSize: "12px", 
              fontWeight: "600",
              backgroundColor: post.status === "PENDING" ? "rgba(234, 179, 8, 0.2)" : 
                             post.status === "PUBLISHED" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color: post.status === "PENDING" ? "#facc15" : 
                     post.status === "PUBLISHED" ? "#4ade80" : "#f87171"
            }}>
              {post.status}
            </span>
          </div>
        ))}
        {posts.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--text-secondary)", padding: "40px 0" }}>
            No posts scheduled yet.
          </div>
        )}
      </div>

      <AIGenerator />

      {showModal && (
        <UploadModal 
          session={session}
          onClose={() => setShowModal(false)}
          onComplete={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
