from typing import Optional
from scrapers.base import BaseScraper


class PanvelScraper(BaseScraper):
    """Panvel scraper — prices are loaded 100% client-side via JavaScript.

    The SSR HTML and ng-state contain product names and links but NO prices.
    Prices require full JavaScript execution (headless browser).
    Currently disabled until we add Playwright support.
    """

    @property
    def name(self) -> str:
        return "panvel"

    async def search(self, remedio: str, cep: str) -> Optional[dict]:
        raise Exception("Panvel indisponível — preços carregam via JavaScript")
