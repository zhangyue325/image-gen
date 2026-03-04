import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const VIDEO_ENDPOINT = `${BASE_URL}/models/veo-3.1-fast-generate-preview:predictLongRunning`;

const EXT_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
};

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function base64FromFile(file: File) {
  return file.arrayBuffer().then((buffer) => {
    const bytes = Buffer.from(buffer);
    return {
      mimeType: file.type || "image/png",
      data: bytes.toString("base64"),
    };
  });
}

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing GEMINI_API_KEY in environment.");
  }
  return key;
}

function videoFilename(mimeType: string) {
  const ext = EXT_BY_MIME[mimeType] || "mp4";
  return `video_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${ext}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const prompt = String(form.get("prompt") || "").trim();
    const fineTunePrompt = String(form.get("fineTunePrompt") || "").trim();
    const mainPrompt = String(form.get("mainPrompt") || "").trim();
    const purposePrompt = String(form.get("purposePrompt") || "").trim();
    const aspectRatio = String(form.get("aspectRatio") || "16:9").trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const product = form.get("product");
    if (!(product instanceof File)) {
      return NextResponse.json(
        { error: "Product image is required." },
        { status: 400 }
      );
    }

    const productData = await base64FromFile(product);

    const payload = {
      instances: [
        {
          prompt: `${mainPrompt} Purpose: ${purposePrompt} ${prompt} ${fineTunePrompt}`.trim(),
          referenceImages: [
            {
              image: {
                bytesBase64Encoded: productData.data,
                mimeType: productData.mimeType,
              },
              referenceType: "asset",
            },
          ],
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
        "x-goog-api-key": getApiKey(),
      },
      body: JSON.stringify(payload),
    });

    const startRaw = await startRes.text();
    if (!startRes.ok) {
      return NextResponse.json(
        { error: "Veo request failed.", details: startRaw },
        { status: 500 }
      );
    }

    const startJson = JSON.parse(startRaw);
    const operationName = startJson?.name;
    if (!operationName) {
      return NextResponse.json(
        { error: "No operation name returned from Veo." },
        { status: 500 }
      );
    }

    const pollUrl = `${BASE_URL}/${operationName}`;
    let statusJson: any = null;

    for (let i = 0; i < 90; i += 1) {
      await sleep(5000);
      const statusRes = await fetch(pollUrl, {
        headers: { "x-goog-api-key": getApiKey() },
      });

      if (!statusRes.ok) {
        const detail = await statusRes.text();
        return NextResponse.json(
          { error: "Polling Veo failed.", details: detail },
          { status: 500 }
        );
      }

      statusJson = await statusRes.json();
      if (statusJson.done === true) break;
    }

    const videoUri =
      statusJson?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

    if (!videoUri) {
      return NextResponse.json(
        { error: "No video URI returned.", details: statusJson },
        { status: 500 }
      );
    }

    const videoRes = await fetch(videoUri, {
      headers: { "x-goog-api-key": getApiKey() },
      redirect: "follow",
    });

    if (!videoRes.ok) {
      const detail = await videoRes.text();
      return NextResponse.json(
        { error: "Failed to download video.", details: detail },
        { status: 500 }
      );
    }

    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const mimeType = videoRes.headers.get("content-type") || "video/mp4";
    const filename = videoFilename(mimeType);
    const outputDir = path.join(process.cwd(), "public", "generated");

    await ensureDir(outputDir);
    await fs.writeFile(path.join(outputDir, filename), videoBuffer);

    return NextResponse.json({ url: `/generated/${filename}`, filename });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
