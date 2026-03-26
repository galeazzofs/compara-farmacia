from typing import Optional
from scrapers.base import BaseScraper


class PanvelScraper(BaseScraper):
    """Panvel scraper — currently blocked by required authentication headers.

    Their API at /api/v2/search and /api/v3/search requires custom headers
    (user-id, sessionId, client-ip) with valid session data that cannot be
    easily replicated from a server.
    """

    @property
    def name(self) -> str:
        return "panvel"

    async def search(self, remedio: str, cep: str) -> Optional[dict]:
        # Panvel API requires session-specific headers (user-id, sessionId)
        # that are generated client-side by their Angular app.
        # TODO: Investigate session bootstrapping or partner API.
        raise Exception("Panvel indisponível — requer autenticação de sessão")
