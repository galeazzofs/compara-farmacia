import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scrapers.drogasil import DrogasilScraper
from scrapers.drogaraia import DrogaRaiaScraper
from scrapers.paguemenos import PagueMenosScraper
from scrapers.drogariasaopaulo import DrogariaSaoPauloScraper
from scrapers.panvel import PanvelScraper

app = FastAPI(title="ComparaFarmacia Scraper")


class SearchRequest(BaseModel):
    remedio: str
    cep: str


class ResultItem(BaseModel):
    farmacia: str
    nome_produto: str
    preco_remedio: float
    frete: float
    preco_total: float
    prazo_dias: int
    url_produto: str


class ErrorItem(BaseModel):
    farmacia: str
    motivo: str


class SearchResponse(BaseModel):
    resultados: list[ResultItem]
    erros: list[ErrorItem]


SCRAPERS = [
    DrogasilScraper(),
    DrogaRaiaScraper(),
    PagueMenosScraper(),
    DrogariaSaoPauloScraper(),
    PanvelScraper(),
]


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    if not request.remedio or not request.cep:
        raise HTTPException(status_code=400, detail="remedio and cep are required")

    if len(request.cep) != 8 or not request.cep.isdigit():
        raise HTTPException(status_code=400, detail="CEP must be 8 digits")

    tasks = [scraper.search(request.remedio, request.cep) for scraper in SCRAPERS]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    resultados = []
    erros = []

    for scraper, result in zip(SCRAPERS, results):
        if isinstance(result, Exception):
            erros.append(ErrorItem(farmacia=scraper.name, motivo=str(result)))
        elif result is None:
            erros.append(ErrorItem(farmacia=scraper.name, motivo="no results"))
        else:
            resultados.append(ResultItem(**result))

    return SearchResponse(resultados=resultados, erros=erros)
