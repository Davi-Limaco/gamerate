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

export interface UsuarioInput {
  nome_usuario?: string;
  email?: string;
  senha?: string;
  id_perfil_fk?: number;
}

export interface LoginInput {
  email: string;
  senha: string;
}
