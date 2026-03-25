import re


def parse_prazo(text: str) -> int:
    """Convert delivery time text to integer days. Returns -1 if unparseable."""
    if not text:
        return -1

    text_lower = text.lower().strip()

    if "hoje" in text_lower:
        return 0
    if "amanhã" in text_lower or "amanha" in text_lower:
        return 1

    match = re.search(r"(\d+)\s*dia", text_lower)
    if match:
        return int(match.group(1))

    if text_lower.isdigit():
        return int(text_lower)

    return -1
