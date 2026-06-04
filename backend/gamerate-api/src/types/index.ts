/**
 * types/index.ts — Definições de tipos centralizadas
 */

export interface Perfil {
  id_perfil: number;
  nome_perfil: string;
}

export interface Usuario {
  id_usuario: number;
  nome_usuario: string;
  email: string;
  senha?: string;
  id_perfil_fk: number;
  nome_perfil?: string;
  data_criacao?: string;
  total_avaliacoes?: number;
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

export interface Genero {
  id_genero: number;
  nome_genero: string;
}

export interface Plataforma {
  id_plataforma: number;
  nome_plataforma: string;
}

export interface Avaliacao {
  id_avaliacao: number;
  id_usuario_fk: number;
  id_jogo_fk: number;
  nota: number;
  titulo: string;
  texto: string;
  data_publicacao: string;
  nome_usuario?: string;
  nome_jogo?: string;
  capa?: string | null;
  id_usuario?: number;
  id_jogo?: number;
}

export interface Categoria {
  id_categoria: number;
  nome_categoria: string;
}

export interface Contato {
  id_comunicacao: number;
  email_contato: string;
  tipo: string;
  mensagem: string;
  data_envio: string;
}
