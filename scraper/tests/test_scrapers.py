import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
from bs4 import BeautifulSoup
from scrapers.drogasil import DrogasilScraper


MOCK_DROGASIL_HTML = """
<html>
<body>
  <div data-testid="product-card">
    <h2 data-testid="product-name">Dipirona Sodica 500mg 10 Comprimidos</h2>
    <span data-testid="product-price">R$ 5,99</span>
    <a href="/dipirona-sodica-500mg">Ver produto</a>
  </div>
</body>
</html>
"""

MOCK_DROGASIL_HTML_NO_PRODUCT = """
<html>
<body>
  <div class="no-results">Nenhum produto encontrado.</div>
</body>
</html>
"""


def make_mock_response(html: str) -> MagicMock:
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.text = html
    mock_response.raise_for_status = MagicMock()
    return mock_response


def _html_parser_bs4(markup, features, **kwargs):
    """Wrapper that forces html.parser for test environments without lxml."""
    return BeautifulSoup.__new__(BeautifulSoup).__init__.__func__(
        BeautifulSoup.__new__(BeautifulSoup), markup, "html.parser", **kwargs
    )


def _make_soup(markup, features, **kwargs):
    return BeautifulSoup(markup, "html.parser", **kwargs)


def test_drogasil_name_property():
    scraper = DrogasilScraper()
    assert scraper.name == "drogasil"


def test_drogasil_search_returns_result():
    scraper = DrogasilScraper()
    mock_response = make_mock_response(MOCK_DROGASIL_HTML)

    with patch.object(scraper, "_get", new=AsyncMock(return_value=mock_response)), \
         patch("scrapers.drogasil.BeautifulSoup", side_effect=_make_soup):
        result = asyncio.run(scraper.search("dipirona", "01310100"))

    assert result is not None
    assert result["farmacia"] == "drogasil"
    assert "Dipirona" in result["nome_produto"]
    assert result["preco_remedio"] == 5.99
    assert result["frete"] == 0.0
    assert result["preco_total"] == 5.99
    assert result["prazo_dias"] == -1
    assert "drogasil.com.br" in result["url_produto"]


def test_drogasil_search_returns_none_when_no_product():
    scraper = DrogasilScraper()
    mock_response = make_mock_response(MOCK_DROGASIL_HTML_NO_PRODUCT)

    with patch.object(scraper, "_get", new=AsyncMock(return_value=mock_response)), \
         patch("scrapers.drogasil.BeautifulSoup", side_effect=_make_soup):
        result = asyncio.run(scraper.search("medicamentoinexistente", "01310100"))

    assert result is None


def test_drogasil_result_has_all_keys():
    scraper = DrogasilScraper()
    mock_response = make_mock_response(MOCK_DROGASIL_HTML)

    with patch.object(scraper, "_get", new=AsyncMock(return_value=mock_response)), \
         patch("scrapers.drogasil.BeautifulSoup", side_effect=_make_soup):
        result = asyncio.run(scraper.search("dipirona", "01310100"))

    required_keys = {
        "farmacia", "nome_produto", "preco_remedio",
        "frete", "preco_total", "prazo_dias", "url_produto"
    }
    assert required_keys.issubset(result.keys())
