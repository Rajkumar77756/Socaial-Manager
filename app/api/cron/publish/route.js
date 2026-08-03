import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { publishToInstagram } from "@/lib/instagram";

// This endpoint gets called by Vercel Cron every X minutes
export async function GET(request) {
  // Ensure the request comes from Vercel Cron or has a valid secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    // Fetch pending posts scheduled for the past/present
    const snapshot = await adminDb
      .collection("posts")
      .where("status", "==", "PENDING")
      .where("scheduledTime", "<=", now.toISOString())
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No posts to publish" });
    }

    const results = [];

    // Process each pending post
    for (const doc of snapshot.docs) {
      const post = doc.data();
      try {
        await adminDb.collection("posts").doc(doc.id).update({ status: "PROCESSING" });

        const publishedId = await publishToInstagram(
          post.videoUrl,
          post.caption,
          post.accessToken,
          post.instagramAccountId
        );

        await adminDb.collection("posts").doc(doc.id).update({ 
          status: "PUBLISHED",
          publishedId: publishedId,
          publishedAt: new Date().toISOString()
        });
        results.push({ id: doc.id, status: "SUCCESS" });
      } catch (error) {
        await adminDb.collection("posts").doc(doc.id).update({ 
          status: "FAILED",
          error: error.message 
        });
        results.push({ id: doc.id, status: "FAILED", error: error.message });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
