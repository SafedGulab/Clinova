import OpenAI from "openai";
import { z } from "zod";
import { getEnv } from "@/lib/env";

export type SpecialtyCatalogEntry = { id: string; name: string; description: string };

export type SuggestResult =
  | { ok: true; specialtyId: string | null; reason: string }
  | { ok: false; code: "DISABLED" | "UPSTREAM"; message: string };

const responseSchema = z.object({
  specialtyId: z.union([z.string(), z.null()]),
  reason: z.string().max(240),
});

let cachedClient: OpenAI | undefined;
function client() {
  if (cachedClient) return cachedClient;
  const env = getEnv();
  if (!env.OPENAI_API_KEY) throw new Error("DISABLED");
  cachedClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return cachedClient;
}

export function isSuggesterEnabled(): boolean {
  return Boolean(getEnv().OPENAI_API_KEY);
}

/**
 * Ask the model which specialty from the clinic's catalog best fits the symptoms.
 * The model is constrained to pick an id from the catalog or null; anything else is coerced to null.
 * Not medical advice — callers must display a disclaimer.
 */
export async function suggestSpecialty(
  symptoms: string,
  catalog: SpecialtyCatalogEntry[],
): Promise<SuggestResult> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) return { ok: false, code: "DISABLED", message: "AI suggester is not configured." };
  if (catalog.length === 0) return { ok: true, specialtyId: null, reason: "No services configured." };

  const catalogText = catalog
    .map((c) => `- id=${c.id} | name=${c.name} | description=${c.description}`)
    .join("\n");

  const system =
    "You route patients to the right clinic specialty based on a brief description of their symptoms. " +
    "You MUST pick an id from the provided catalog or return null if nothing fits. " +
    "You do not diagnose, prescribe, or recommend treatment. Keep the reason to one short sentence " +
    'addressed to the patient (e.g., "Cardiology handles chest pain and heart-related symptoms."). ' +
    'Respond as strict JSON: {"specialtyId": string | null, "reason": string}.';

  const user = `Catalog:\n${catalogText}\n\nPatient symptoms:\n${symptoms}`;

  let raw: string;
  try {
    const completion = await client().chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0,
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? "";
  } catch (e) {
    console.error("AI suggest-specialty upstream error:", e instanceof Error ? e.name : "unknown");
    return { ok: false, code: "UPSTREAM", message: "The suggestion service is unavailable. Please pick a service manually." };
  }

  let parsed: z.infer<typeof responseSchema>;
  try {
    parsed = responseSchema.parse(JSON.parse(raw));
  } catch {
    return { ok: true, specialtyId: null, reason: "Could not confidently suggest a specialty. Please pick one below." };
  }

  const validIds = new Set(catalog.map((c) => c.id));
  const specialtyId = parsed.specialtyId && validIds.has(parsed.specialtyId) ? parsed.specialtyId : null;
  return { ok: true, specialtyId, reason: parsed.reason.trim() || "Pick the service that fits best." };
}
