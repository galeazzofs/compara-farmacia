export function normalizeSearchTerm(term: string): string {
  if (!term || !term.trim()) return "";

  let normalized = term
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  // Remove accents
  normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Standardize dosage: "500 mg" -> "500mg"
  normalized = normalized.replace(/(\d+)\s*(mg|ml|mcg|ui)/gi, "$1$2");

  // Convert grams to mg: "1g" -> "1000mg", "0.5g" -> "500mg"
  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s*g\b/gi, (_, num) => {
    return `${Math.round(parseFloat(num) * 1000)}mg`;
  });

  return normalized;
}
