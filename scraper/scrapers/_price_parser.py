import re

def parse_price(text: str) -> float:
    """Parse 'R$ 12,90' -> 12.90"""
    cleaned = re.sub(r"[^\d,.]", "", text)
    cleaned = cleaned.replace(".", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return 0.0
