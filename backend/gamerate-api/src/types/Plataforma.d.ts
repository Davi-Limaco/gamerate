export interface Plataforma {
  id_plataforma: number;
  nome_plataforma: string;
  total_jogos?: number;
}

export interface PlataformaInput {
  nome_plataforma?: string;
}
