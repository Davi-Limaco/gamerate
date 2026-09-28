import type { Genero } from '@/types/Genero.d.ts';
import type { Plataforma } from '@/types/Plataforma.d.ts';

export type { Genero, Plataforma } from '@/types/Genero.d.ts';
export type { PlataformaInput } from '@/types/Plataforma.d.ts';
export type { GeneroInput } from '@/types/Genero.d.ts';

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
