import { GoogleGenAI } from "@google/genai";
import { createClient } from "../../../../lib/supabase/server";

type ReferenceImage = {
  name?: string;
  mimeType?: string;
  data?: string;
};

export async function POST(req: Request) {
  try {
    const { prompt, ratio, resolution, referenceImages } = (await req.json()) as {
      prompt?: string;
      ratio?: string;
      resolution?: string;
      referenceImages?: ReferenceImage[];
    };

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Missing prompt" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: setting, error: settingError } = await supabase
      .from("setting")
      .select("main_prompt,logo")
      .eq("user_name", "Pazzion")
      .single();

    if (settingError) {
      return Response.json({ error: `Failed to read setting info: ${settingError.message}` }, { status: 500 });
    }


    const contentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: setting?.main_prompt || "" },
      { text: prompt || "" },
    ];

    if (setting?.logo) {
      const logoRes = await fetch(setting.logo);
      if (!logoRes.ok) {
        return Response.json({ error: "Failed to fetch logo image from setting.logo" }, { status: 500 });
      }

      const mimeType = logoRes.headers.get("content-type") || "image/png";
      const arrayBuffer = await logoRes.arrayBuffer();
      const data = Buffer.from(arrayBuffer).toString("base64");
      contentParts.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }

    if (Array.isArray(referenceImages)) {
      for (const image of referenceImages) {
        if (!image?.data) continue;
        contentParts.push({
          inlineData: {
            mimeType: image.mimeType || "image/png",
            data: image.data,
          },
        });
      }
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: contentParts }],
      config: {
        imageConfig: {
          aspectRatio: ratio,
          imageSize: resolution,
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imageBase64 = parts.find((part) => part.inlineData?.data)?.inlineData?.data;

    if (!imageBase64) {
      return Response.json({ error: "No image generated" }, { status: 502 });
    }

    return Response.json({ imageBase64 });
  } catch (error) {
    console.error("generate_image failed:", error);
    const err = error as { message?: string; status?: number };
    return Response.json(
      { error: err.message ?? "Image generation failed" },
      { status: err.status ?? 500 }
    );
  }
}
