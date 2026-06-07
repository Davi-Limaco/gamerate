export interface Contato {
  id_comunicacao: number;
  email_contato: string;
  tipo: string;
  mensagem: string;
  data_comunicacao: string;
}

export interface ContatoInput {
  email_contato?: string;
  tipo?: string;
  mensagem?: string;
}