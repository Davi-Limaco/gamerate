export interface Genero {
  id_genero: number;
  nome_genero: string;
  total_jogos?: number;
}

export interface Plataforma {
  id_plataforma: number;
  nome_plataforma: string;
  total_jogos?: number;
}

export interface GeneroInput {
  nome_genero?: string;
}

export interface PlataformaInput {
  nome_plataforma?: string;
}

export interface Jogo {
  id_jogo: number;
  nome_jogo: string;
  desenvolvedora: string;
  data_lancamento: string;
  descricao: string;
  nota_media: number | null;
  total_avaliacoes: number;
  capa: string | null;
  generos?: Genero[];
  plataformas?: Plataforma[];
}

export interface JogoResumo {
  id_jogo: number;
  nome_jogo: string;
  desenvolvedora: string;
  data_lancamento: string;
  nota_media: number | null;
  total_avaliacoes: number;
  capa: string | null;
}

export interface JogoFilter {
  search?: string;
  genero?: string;
  plataforma?: string;
}

export interface JogoInput {
  nome_jogo?: string;
  desenvolvedora?: string;
  data_lancamento?: string;
  descricao?: string;
  capa?: string | null;
  generos?: number[];
  plataformas?: number[];
}
