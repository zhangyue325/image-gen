import { createClient } from "../../../../lib/supabase/server";

type ReferenceImage = {
  name?: string;
  mimeType?: string;
  data?: string;
};

type GenerateVideoPayload = {
  prompt?: string;
  purpose?: string;
  aspectRatio?: string;
  videoLength?: string;
  resolution?: string;
  referenceImages?: ReferenceImage[];
};

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const VIDEO_ENDPOINT = `${BASE_URL}/models/veo-3.1-fast-generate-preview:predictLongRunning`;

function getPurposePrompt(
  purposePrompt: unknown,
  purpose: string | undefined
): string {
  if (!purposePrompt || typeof purposePrompt !== "object") return "";
  const value = (purposePrompt as Record<string, unknown>)[purpose || ""];
  return typeof value === "string" ? value : "";
}

export async function POST(req: Request) {
  try {
    const {
      prompt,
      purpose,
      aspectRatio,
      videoLength,
      resolution,
      referenceImages,
    } = (await req.json()) as GenerateVideoPayload;

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Missing prompt" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: setting, error: settingError } = await supabase
      .from("setting")
      .select("main_prompt,purpose_prompt,logo")
      .eq("user_name", "Pazzion")
      .single();

    if (settingError) {
      return Response.json(
        { error: `Failed to read setting info: ${settingError.message}` },
        { status: 500 }
      );
    }

    const purposePrompt = getPurposePrompt(setting?.purpose_prompt, purpose);
    const referenceNames =
      Array.isArray(referenceImages) && referenceImages.length > 0
        ? referenceImages
            .map((img) => (img.name || "").trim())
            .filter(Boolean)
            .join(", ")
        : "";

    const combinedPrompt = [
      setting?.main_prompt || "",
      purposePrompt,
      `Purpose: ${purpose || "not specified"}`,
      `Requested video length: ${videoLength || "not specified"} seconds`,
      `Requested resolution: ${resolution || "not specified"}`,
      referenceNames ? `Reference images: ${referenceNames}` : "",
      prompt,
    ]
      .filter(Boolean)
      .join("\n");

    const veoReferenceImages: Array<{
      image: { bytesBase64Encoded: string; mimeType: string };
      referenceType: "asset";
    }> = [];

    if (setting?.logo && typeof setting.logo === "string") {
      const logoRes = await fetch(setting.logo);
      if (logoRes.ok) {
        const logoMimeType = logoRes.headers.get("content-type") || "image/png";
        const logoArrayBuffer = await logoRes.arrayBuffer();
        const logoBase64 = Buffer.from(logoArrayBuffer).toString("base64");
        veoReferenceImages.push({
          image: {
            bytesBase64Encoded: logoBase64,
            mimeType: logoMimeType,
          },
          referenceType: "asset",
        });
      }
    }

    if (Array.isArray(referenceImages)) {
      for (const image of referenceImages) {
        if (!image?.data) continue;
        veoReferenceImages.push({
          image: {
            bytesBase64Encoded: image.data,
            mimeType: image.mimeType || "image/png",
          },
          referenceType: "asset",
        });
      }
    }

    const payload = {
      instances: [
        {
          prompt: combinedPrompt,
          referenceImages: veoReferenceImages,
        },
      ],
      parameters: {
        aspectRatio: aspectRatio || "16:9",
      },
    };

    const startRes = await fetch(VIDEO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const startRaw = await startRes.text();
    if (!startRes.ok) {
      return Response.json(
        { error: "Veo request failed", details: startRaw },
        { status: 500 }
      );
    }

    const startJson = JSON.parse(startRaw);
    const operationName = startJson?.name;
    if (!operationName) {
      return Response.json(
        { error: "No operation name returned from Veo" },
        { status: 500 }
      );
    }

    const pollUrl = `${BASE_URL}/${operationName}`;
    let statusJson: any = null;

    for (let i = 0; i < 90; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const statusRes = await fetch(pollUrl, {
        headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
      });

      if (!statusRes.ok) {
        const detail = await statusRes.text();
        return Response.json(
          { error: "Polling Veo failed", details: detail },
          { status: 500 }
        );
      }

      statusJson = await statusRes.json();
      if (statusJson.error) {
        return Response.json(
          { error: "Veo operation error", details: statusJson.error },
          { status: 500 }
        );
      }

      if (statusJson.done === true) break;
    }

    if (!statusJson?.done) {
      return Response.json(
        { error: "Video generation timed out" },
        { status: 504 }
      );
    }

    const videoUri =
      statusJson?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

    if (!videoUri) {
      return Response.json(
        { error: "No video URI returned", details: statusJson },
        { status: 500 }
      );
    }

    const videoRes = await fetch(videoUri, {
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
      redirect: "follow",
    });

    if (!videoRes.ok) {
      const detail = await videoRes.text();
      return Response.json(
        { error: "Failed to download video", details: detail },
        { status: 500 }
      );
    }

    const mimeType = videoRes.headers.get("content-type") || "video/mp4";
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const videoBase64 = videoBuffer.toString("base64");

    return Response.json({ videoBase64, mimeType });
  } catch (error) {
    console.error("generate_video failed:", error);
    const err = error as { message?: string; status?: number };
    return Response.json(
      { error: err.message ?? "Video generation failed" },
      { status: err.status ?? 500 }
    );
  }
}

