from typing import Optional
from scrapers.base import BaseScraper


class DrogariaSaoPauloScraper(BaseScraper):
    """Scraper using VTEX Intelligent Search REST API."""

    @property
    def name(self) -> str:
        return "drogariasaopaulo"

    async def search(self, remedio: str, cep: str) -> Optional[dict]:
        url = "https://www.drogariasaopaulo.com.br/api/io/_v/api/intelligent-search/product_search/trade-policy/1"
        params = {"query": remedio, "count": 5, "page": 1}
        response = await self._get(url, params=params)
        data = response.json()

        products = data.get("products", [])
        if not products:
            return None

        product = products[0]
        nome_produto = product.get("productName", remedio)
        link = product.get("link", "")
        url_produto = f"https://www.drogariasaopaulo.com.br{link}" if link else url

        price_range = product.get("priceRange", {})
        selling = price_range.get("sellingPrice", {})
        preco_remedio = selling.get("lowPrice", 0.0)

        if preco_remedio == 0.0:
            return None

        frete = 0.0
        prazo_dias = -1
        preco_total = preco_remedio + frete

        return {
            "farmacia": "Drogaria São Paulo",
            "nome_produto": nome_produto,
            "preco_remedio": round(preco_remedio, 2),
            "frete": frete,
            "preco_total": round(preco_total, 2),
            "prazo_dias": prazo_dias,
            "url_produto": url_produto,
        }
