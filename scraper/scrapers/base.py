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
        """Standard GET using httpx (for open APIs like VTEX)."""
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

    async def _get_impersonate(self, url: str, retries: int = 2) -> str:
        """GET using curl_cffi with Chrome TLS impersonation (for anti-bot sites)."""
        from curl_cffi import requests as curl_requests

        await self._rate_limit()
        last_error = None
        for attempt in range(retries + 1):
            try:
                response = curl_requests.get(
                    url,
                    impersonate="chrome",
                    timeout=REQUEST_TIMEOUT,
                )
                response.raise_for_status()
                return response.text
            except Exception as e:
                last_error = e
                if attempt < retries:
                    await asyncio.sleep(2 ** attempt)
        raise last_error
