/** Foto de perfil associada a um usuário (tabela `imagem`, relação 1:1). */
export interface Imagem {
  id_imagem: number;
  /** Caminho público do arquivo, ex.: /uploads/avatars/<uuid>.png */
  caminho: string;
  id_usuario_fk: number;
  data_envio: string;
}
