import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const IMAGE_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent";

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
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

function imageFilename(mimeType: string) {
  const ext = EXT_BY_MIME[mimeType] || "png";
  return `image_${Date.now()}_${crypto.randomBytes(6).toString("hex")}.${ext}`;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const prompt = String(form.get("prompt") || "").trim();
    const mainPrompt = String(form.get("mainPrompt") || "").trim();
    const purposePrompt = String(form.get("purposePrompt") || "").trim();
    const aspectRatio = String(form.get("aspectRatio") || "").trim();
    const imageSize = String(form.get("imageSize") || "").trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const logo = form.get("logo");
    const product = form.get("product");
    if (!(logo instanceof File) || !(product instanceof File)) {
      return NextResponse.json(
        { error: "Logo and product images are required." },
        { status: 400 }
      );
    }

    const previousImage = form.get("previousImage");
    const logoData = await base64FromFile(logo);
    const productData = await base64FromFile(product);

    const parts: Array<Record<string, unknown>> = [
      { text: "brand logo image" },
      { inlineData: logoData },
      { text: "product image" },
      { inlineData: productData },
    ];

    if (previousImage instanceof File) {
      const prevData = await base64FromFile(previousImage);
      parts.push({ text: "the generated image to be refined" });
      parts.push({ inlineData: prevData });
      parts.push({ text: "Please refine the generated image based on the prompt below:" });
    } else {
      if (mainPrompt) parts.push({ text: mainPrompt });
      if (purposePrompt) {
        parts.push({ text: "Purpose:" });
        parts.push({ text: purposePrompt });
      }
    }

    parts.push({ text: prompt });

    const payload = {
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: aspectRatio || undefined,
          imageSize: imageSize || undefined,
        },
      },
    };

    const res = await fetch(IMAGE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": getApiKey(),
      },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: "Gemini image generation failed.", details: raw },
        { status: 500 }
      );
    }

    const json = JSON.parse(raw);
    const partsOut = json?.candidates?.[0]?.content?.parts || [];
    const imagePart = partsOut.find(
      (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData?.data
    );

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json({ error: "No image returned." }, { status: 500 });
    }

    const mimeType = imagePart.inlineData.mimeType || "image/png";
    const fileBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    const filename = imageFilename(mimeType);
    const outputDir = path.join(process.cwd(), "public", "generated");

    await ensureDir(outputDir);
    await fs.writeFile(path.join(outputDir, filename), fileBuffer);

    return NextResponse.json({ url: `/generated/${filename}`, filename });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
