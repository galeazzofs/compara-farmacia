import re
import unicodedata


def normalize_search_term(term: str) -> str:
    if not term or not term.strip():
        return ""

    normalized = term.lower().strip()
    normalized = re.sub(r"\s+", " ", normalized)

    # Remove accents
    normalized = unicodedata.normalize("NFD", normalized)
    normalized = re.sub(r"[\u0300-\u036f]", "", normalized)

    # Standardize dosage: "500 mg" -> "500mg"
    normalized = re.sub(r"(\d+)\s*(mg|ml|mcg|ui)", r"\1\2", normalized, flags=re.IGNORECASE)

    # Convert grams to mg: "1g" -> "1000mg"
    def grams_to_mg(match):
        num = float(match.group(1))
        return f"{round(num * 1000)}mg"

    normalized = re.sub(r"(\d+(?:\.\d+)?)\s*g\b", grams_to_mg, normalized, flags=re.IGNORECASE)

    return normalized
