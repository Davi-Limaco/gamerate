/** Jogo favorito de um usuário, já com os dados do jogo para exibição. */
export interface Favorito {
  id_favorito: number;
  id_jogo: number;
  nome_jogo: string;
  capa: string | null;
  desenvolvedora: string;
  nota_media: number | null;
  data_criacao: string;
}
