import asyncio
import time
from abc import ABC, abstractmethod
from typing import Optional

import httpx
from config import USER_AGENT, REQUEST_TIMEOUT, RATE_LIMIT_SECONDS


class BaseScraper(ABC):
    """Abstract base class for pharmacy scrapers."""

    def __init__(self):
        self._last_request_time = 0.0

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    async def search(self, remedio: str, cep: str) -> Optional[dict]:
        ...

    async def _rate_limit(self):
        now = time.monotonic()
        elapsed = now - self._last_request_time
        if self._last_request_time > 0 and elapsed < RATE_LIMIT_SECONDS:
            await asyncio.sleep(RATE_LIMIT_SECONDS - elapsed)
        self._last_request_time = time.monotonic()

    async def _get(self, url: str, params: dict = None, retries: int = 2) -> httpx.Response:
        await self._rate_limit()
        last_error = None
        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(
                    headers={"User-Agent": USER_AGENT},
                    timeout=REQUEST_TIMEOUT,
                    follow_redirects=True,
                ) as client:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    return response
            except (httpx.HTTPStatusError, httpx.RequestError) as e:
                last_error = e
                if attempt < retries:
                    await asyncio.sleep(2 ** attempt)
        raise last_error
