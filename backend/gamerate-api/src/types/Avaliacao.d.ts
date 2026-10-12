export interface Avaliacao {
  id_avaliacao: number;
  id_usuario_fk: number;
  id_jogo_fk: number;
  nota: number;
  titulo: string;
  texto: string;
  data_publicacao: string;
  nome_usuario?: string;
  /** Foto de perfil do autor (caminho público) ou null. */
  caminho_imagem_usuario?: string | null;
  nome_jogo?: string;
  capa?: string | null;
  id_usuario?: number;
  id_jogo?: number;
}

export interface AvaliacaoFilter {
  jogo_id?: number;
}

export interface AvaliacaoInput {
  id_usuario_fk?: number;
  id_jogo_fk?: number;
  nota?: number;
  titulo?: string;
  texto?: string;
}
