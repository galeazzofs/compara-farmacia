import { NextRequest, NextResponse } from "next/server";
import { MAX_IMAGE_SIZE_MB } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG and PNG are supported" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Google Cloud Vision OCR
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    const visionData = await visionResponse.json();
    const rawText = visionData.responses?.[0]?.fullTextAnnotation?.text || "";

    if (!rawText) {
      return NextResponse.json({
        remedios: [],
        texto_bruto: "",
        confianca: 0,
      });
    }

    // Google Gemini to extract medicine names
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extraia os nomes dos medicamentos e dosagens do texto abaixo. O texto foi extraído via OCR de uma receita médica ou caixa de remédio, então pode ter erros.

Retorne APENAS um JSON array no formato:
[{"nome": "nome do remédio", "dosagem": "dosagem ou null"}]

Texto OCR:
${rawText}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    let remedios = [];
    try {
      const jsonMatch = geminiText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        remedios = JSON.parse(jsonMatch[0]);
      }
    } catch {
      remedios = [];
    }

    return NextResponse.json({
      remedios,
      texto_bruto: rawText,
      confianca: remedios.length > 0 ? 0.8 : 0.2,
    });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
