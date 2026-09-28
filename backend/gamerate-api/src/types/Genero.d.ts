export interface Genero {
  id_genero: number;
  nome_genero: string;
  total_jogos?: number;
}

export interface GeneroInput {
  nome_genero?: string;
}
