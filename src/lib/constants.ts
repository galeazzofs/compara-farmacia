export const FARMACIAS = [
  { id: "drogasil", nome: "Drogasil", cor: "#E31837" },
  { id: "drogaraia", nome: "Droga Raia", cor: "#00A651" },
  { id: "paguemenos", nome: "Pague Menos", cor: "#003DA5" },
  { id: "drogariasaopaulo", nome: "Drogaria São Paulo", cor: "#D4213D" },
  { id: "panvel", nome: "Panvel", cor: "#0066B3" },
] as const;

export const PRAZO_THRESHOLDS = {
  rapido: { max: 2, cor: "green" },
  medio: { max: 5, cor: "yellow" },
  lento: { min: 6, cor: "red" },
} as const;

export const CACHE_TTL_HOURS = 1;
export const MAX_LIST_ITEMS = 10;
export const MAX_IMAGE_SIZE_MB = 10;
export const SCRAPER_TIMEOUT_MS = 20000;
