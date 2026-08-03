export async function publishToInstagram(videoUrl, caption, accessToken, instagramAccountId) {
  try {
    // Step 1: Create Media Container
    const containerResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "REELS",
        video_url: videoUrl,
        caption: caption,
        access_token: accessToken,
      }),
    });

    const containerData = await containerResponse.json();
    if (containerData.error) throw new Error(containerData.error.message);

    const creationId = containerData.id;

    // Step 2: Poll for completion
    let isReady = false;
    let attempts = 0;
    while (!isReady && attempts < 15) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      const statusResponse = await fetch(
        `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`
      );
      const statusData = await statusResponse.json();
      
      if (statusData.status_code === "FINISHED") {
        isReady = true;
      } else if (statusData.status_code === "ERROR") {
        throw new Error("Instagram API failed to process the video.");
      }
      attempts++;
    }

    if (!isReady) throw new Error("Video processing timed out.");

    // Step 3: Publish
    const publishResponse = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });

    const publishData = await publishResponse.json();
    if (publishData.error) throw new Error(publishData.error.message);

    return publishData.id; // The published media ID
  } catch (error) {
    console.error("Instagram Publish Error:", error);
    throw error;
  }
}
