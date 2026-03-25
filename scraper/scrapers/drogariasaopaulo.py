from typing import Optional
from bs4 import BeautifulSoup
from scrapers.base import BaseScraper
from scrapers._price_parser import parse_price


class DrogariaSaoPauloScraper(BaseScraper):
    @property
    def name(self) -> str:
        return "drogariasaopaulo"

    async def search(self, remedio: str, cep: str) -> Optional[dict]:
        url = f"https://www.drogariasaopaulo.com.br/search?w={remedio}"
        response = await self._get(url)
        soup = BeautifulSoup(response.text, "lxml")

        product = soup.select_one(
            "[data-testid='product-card'], .product-card, .product-item, .item-product"
        )
        if not product:
            return None

        nome_el = product.select_one(
            "[data-testid='product-name'], .product-name, .product-title, h2, h3"
        )
        price_el = product.select_one(
            "[data-testid='product-price'], .product-price, .price, .preco"
        )
        link_el = product.select_one("a[href]")

        nome_produto = nome_el.get_text(strip=True) if nome_el else remedio
        preco_remedio = parse_price(price_el.get_text(strip=True)) if price_el else 0.0
        url_produto = link_el["href"] if link_el else url
        if url_produto and not url_produto.startswith("http"):
            url_produto = "https://www.drogariasaopaulo.com.br" + url_produto

        frete = 0.0
        prazo_dias = -1
        preco_total = preco_remedio + frete

        return {
            "farmacia": self.name,
            "nome_produto": nome_produto,
            "preco_remedio": preco_remedio,
            "frete": frete,
            "preco_total": preco_total,
            "prazo_dias": prazo_dias,
            "url_produto": url_produto,
        }
