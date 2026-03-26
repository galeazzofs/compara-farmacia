from typing import Optional
from scrapers.base import BaseScraper


class DrogasilScraper(BaseScraper):
    """Drogasil scraper — currently blocked by Akamai anti-bot protection.

    Their GraphQL API at /api/next/busca/graphql requires browser-level
    cookies and bot detection tokens that cannot be replicated from a server.
    This scraper returns None until we can find an alternative approach
    (e.g., partnership API or headless browser with stealth plugins).
    """

    @property
    def name(self) -> str:
        return "drogasil"

    async def search(self, remedio: str, cep: str) -> Optional[dict]:
        # Drogasil uses Akamai anti-bot protection that blocks server requests.
        # Their GraphQL API requires browser-specific tokens.
        # TODO: Investigate headless browser with stealth or partner API.
        raise Exception("Drogasil indisponível — proteção anti-bot ativa")
