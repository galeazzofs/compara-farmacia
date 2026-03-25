export interface SearchResult {
  farmacia: string;
  nome_produto: string;
  preco_remedio: number;
  frete: number;
  preco_total: number;
  prazo_dias: number;
  url_produto: string;
}

export interface SearchResponse {
  resultados: SearchResult[];
  erros: { farmacia: string; motivo: string }[];
}

export interface CachedResult {
  id: string;
  nome_remedio: string;
  nome_produto: string;
  cep: string;
  farmacia: string;
  preco_remedio: number;
  frete: number;
  prazo_dias: number;
  preco_total: number;
  url_produto: string;
  buscado_em: string;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  nome_lista: string;
  created_at: string;
  items?: ShoppingListItem[];
}

export interface ShoppingListItem {
  id: string;
  lista_id: string;
  nome_remedio: string;
  principio_ativo: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  cep_padrao: string;
  created_at: string;
}

export interface OcrResult {
  remedios: { nome: string; dosagem: string | null }[];
  texto_bruto: string;
  confianca: number;
}
