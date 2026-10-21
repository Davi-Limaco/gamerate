export type TipoMidia = 'imagem' | 'video';

/** Print ou vídeo de gameplay postado por um usuário. */
export interface Midia {
  id_midia: number;
  tipo: TipoMidia;
  /** Caminho público, ex.: /uploads/midias/<uuid>.mp4 */
  caminho: string;
  titulo: string;
  descricao: string | null;
  id_usuario_fk: number;
  nome_usuario?: string;
  id_jogo_fk: number | null;
  nome_jogo?: string | null;
  data_envio: string;
}

export interface MidiaInput {
  titulo: string;
  descricao?: string;
  id_jogo_fk?: number;
}

export interface MidiaFilter {
  tipo?: TipoMidia;
  usuario_id?: number;
  jogo_id?: number;
  limit?: number;
}
