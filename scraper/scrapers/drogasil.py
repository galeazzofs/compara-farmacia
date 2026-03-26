import json
import re
from typing import Optional

from scrapers.base import BaseScraper


class DrogasilScraper(BaseScraper):
    """Scraper for Drogasil using curl_cffi to bypass Akamai anti-bot.

    Fetches __NEXT_DATA__ from search page and extracts product + price.
    """

    @property
    def name(self) -> str:
        return "drogasil"

    async def search(self, remedio: str, cep: str) -> Optional[dict]:
        url = f"https://www.drogasil.com.br/search?w={remedio}"
        response = await self._get_impersonate(url)

        match = re.search(
            r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
            response,
        )
        if not match:
            return None

        data = json.loads(match.group(1))
        products = (
            data.get("props", {})
            .get("pageProps", {})
            .get("pageProps", {})
            .get("results", {})
            .get("products", [])
        )

        # Filter: non-sponsored products with a valid price
        priced = [
            p for p in products
            if p.get("priceService") and p.get("priceService") > 0
        ]
        if not priced:
            return None

        product = priced[0]
        nome_produto = product.get("name", remedio)
        preco_remedio = product.get("priceService", 0.0)
        url_path = product.get("url", "")
        url_produto = f"https://www.drogasil.com.br{url_path}" if url_path else url

        frete = 0.0
        prazo_dias = -1
        preco_total = preco_remedio + frete

        return {
            "farmacia": "Drogasil",
            "nome_produto": nome_produto,
            "preco_remedio": round(preco_remedio, 2),
            "frete": frete,
            "preco_total": round(preco_total, 2),
            "prazo_dias": prazo_dias,
            "url_produto": url_produto,
        }
