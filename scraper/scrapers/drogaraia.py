from typing import Optional
from scrapers.base import BaseScraper


class DrogaRaiaScraper(BaseScraper):
    """Droga Raia scraper — currently blocked by Akamai anti-bot protection.

    Same parent company as Drogasil (RaiaDrogasil), identical architecture.
    Their GraphQL API at /api/next/busca/graphql requires browser-level
    cookies and bot detection tokens.
    """

    @property
    def name(self) -> str:
        return "drogaraia"

    async def search(self, remedio: str, cep: str) -> Optional[dict]:
        # Droga Raia uses Akamai anti-bot protection (same as Drogasil).
        # TODO: Investigate headless browser with stealth or partner API.
        raise Exception("Droga Raia indisponível — proteção anti-bot ativa")
