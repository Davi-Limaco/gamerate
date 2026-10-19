import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ZodTypeAny } from 'zod';

import { avaliacaoBodySchema, avaliacaoQuerySchema, avaliacaoUpdateBodySchema } from '@/schemas/avaliacao.schema.ts';
import { generoBodySchema, perfilBodySchema, plataformaBodySchema } from '@/schemas/catalog.schema.ts';
import { contatoBodySchema } from '@/schemas/contato.schema.ts';
import { idParamSchema } from '@/schemas/id-param.schema.ts';
import { jogoBodySchema, jogoQuerySchema, jogoUpdateBodySchema } from '@/schemas/jogo.schema.ts';
import {
  cadastroBodySchema, loginBodySchema, usuarioBodySchema, usuarioPerfilBodySchema, usuarioUpdateBodySchema,
} from '@/schemas/usuario.schema.ts';

// Testes de unidade: schemas Zod são funções puras — sem servidor, banco ou rede.

/** Mensagens de erro de um parse que deve falhar. */
function erros(schema: ZodTypeAny, input: unknown): string[] {
  const result = schema.safeParse(input);
  assert.equal(result.success, false, 'a entrada deveria ser rejeitada');
  return result.error.issues.map((i) => i.message);
}

const usuarioValido = { nome_usuario: 'Maria Silva', email: 'maria@example.test', senha: 'segredo123' };

describe('usuario.schema', () => {
  it('aceita um usuário válido', () => {
    assert.deepEqual(usuarioBodySchema.parse(usuarioValido), usuarioValido);
  });

  it('converte id_perfil_fk numérico enviado como string', () => {
    assert.equal(usuarioBodySchema.parse({ ...usuarioValido, id_perfil_fk: '2' }).id_perfil_fk, 2);
  });

  it('rejeita corpo vazio apontando os três campos obrigatórios', () => {
    const mensagens = erros(usuarioBodySchema, {});
    assert.deepEqual(mensagens, ['nome_usuario é obrigatório', 'email é obrigatório', 'senha é obrigatória']);
  });

  it('rejeita string vazia, nome curto e senha curta', () => {
    assert.ok(erros(usuarioBodySchema, { ...usuarioValido, nome_usuario: '' }).some((m) => m.includes('mínimo 3')));
    assert.ok(erros(usuarioBodySchema, { ...usuarioValido, nome_usuario: 'ab' }).some((m) => m.includes('mínimo 3')));
    assert.ok(erros(usuarioBodySchema, { ...usuarioValido, senha: '12345' }).some((m) => m.includes('mínimo 6')));
  });

  it('respeita os limites máximos (borda: exatamente no limite passa, um a mais falha)', () => {
    assert.ok(usuarioBodySchema.safeParse({ ...usuarioValido, nome_usuario: 'a'.repeat(150) }).success);
    assert.ok(!usuarioBodySchema.safeParse({ ...usuarioValido, nome_usuario: 'a'.repeat(151) }).success);
    assert.ok(usuarioBodySchema.safeParse({ ...usuarioValido, senha: 'a'.repeat(200) }).success);
    assert.ok(!usuarioBodySchema.safeParse({ ...usuarioValido, senha: 'a'.repeat(201) }).success);
  });

  it('rejeita e-mails sem formato válido', () => {
    for (const email of ['', 'sem-arroba', 'a@', '@dominio.com', 'a b@c.com']) {
      assert.ok(erros(usuarioBodySchema, { ...usuarioValido, email }).length > 0, `deveria rejeitar "${email}"`);
    }
  });

  it('rejeita tipos errados (número no lugar de string, null)', () => {
    assert.ok(!usuarioBodySchema.safeParse({ ...usuarioValido, nome_usuario: 123 }).success);
    assert.ok(!usuarioBodySchema.safeParse({ ...usuarioValido, email: null }).success);
  });

  it('rejeita id_perfil_fk inválido (zero, negativo, decimal, texto)', () => {
    for (const id_perfil_fk of [0, -1, 1.5, 'abc']) {
      assert.ok(!usuarioBodySchema.safeParse({ ...usuarioValido, id_perfil_fk }).success);
    }
  });

  it('cadastro descarta id_perfil_fk: o perfil é decidido pelo back-end (anti escalada de privilégio)', () => {
    const resultado = cadastroBodySchema.parse({ ...usuarioValido, id_perfil_fk: 2 });
    assert.equal('id_perfil_fk' in resultado, false);
  });

  it('login exige e-mail válido e senha não vazia', () => {
    assert.ok(loginBodySchema.safeParse({ email: 'a@b.co', senha: 'x' }).success);
    assert.ok(erros(loginBodySchema, { email: 'a@b.co', senha: '' }).includes('senha é obrigatória'));
    assert.ok(!loginBodySchema.safeParse({ email: 'ruim', senha: 'x' }).success);
  });

  it('atualização aceita campos parciais, mas não um corpo vazio', () => {
    assert.deepEqual(usuarioUpdateBodySchema.parse({ nome_usuario: 'Novo Nome' }), { nome_usuario: 'Novo Nome' });
    assert.deepEqual(erros(usuarioUpdateBodySchema, {}), ['Envie ao menos um campo para atualizar']);
  });

  it('atualização continua validando os campos enviados', () => {
    assert.ok(!usuarioUpdateBodySchema.safeParse({ email: 'ruim' }).success);
  });

  it('atualização ignora id_perfil_fk (troca de perfil só pela rota de administrador)', () => {
    assert.deepEqual(usuarioUpdateBodySchema.parse({ nome_usuario: 'Abc', id_perfil_fk: 2 }), { nome_usuario: 'Abc' });
  });

  it('troca de perfil exige id_perfil_fk positivo', () => {
    assert.equal(usuarioPerfilBodySchema.parse({ id_perfil_fk: '3' }).id_perfil_fk, 3);
    assert.ok(!usuarioPerfilBodySchema.safeParse({}).success);
    assert.ok(!usuarioPerfilBodySchema.safeParse({ id_perfil_fk: 0 }).success);
  });
});

describe('avaliacao.schema', () => {
  const valida = { id_jogo_fk: 1, nota: 4.5, titulo: 'Muito bom', texto: 'Gostei bastante.' };

  it('aceita uma avaliação válida e converte números enviados como string', () => {
    const r = avaliacaoBodySchema.parse({ ...valida, id_jogo_fk: '3', nota: '4' });
    assert.equal(r.id_jogo_fk, 3);
    assert.equal(r.nota, 4);
  });

  it('bordas da nota: 5 é aceito; 0, negativo e acima de 5 são rejeitados', () => {
    assert.ok(avaliacaoBodySchema.safeParse({ ...valida, nota: 5 }).success);
    assert.ok(avaliacaoBodySchema.safeParse({ ...valida, nota: 0.5 }).success);
    for (const nota of [0, -1, 5.01, 6]) assert.ok(!avaliacaoBodySchema.safeParse({ ...valida, nota }).success, `nota ${nota}`);
  });

  it('rejeita título curto ou longo demais e texto vazio', () => {
    assert.ok(erros(avaliacaoBodySchema, { ...valida, titulo: 'ab' }).some((m) => m.includes('mínimo 3')));
    assert.ok(!avaliacaoBodySchema.safeParse({ ...valida, titulo: 'a'.repeat(201) }).success);
    assert.ok(erros(avaliacaoBodySchema, { ...valida, texto: '' }).includes('texto é obrigatório'));
    assert.ok(!avaliacaoBodySchema.safeParse({ ...valida, texto: 'a'.repeat(2001) }).success);
  });

  it('rejeita id_jogo_fk inválido', () => {
    for (const id_jogo_fk of [0, -2, 1.2, 'x']) assert.ok(!avaliacaoBodySchema.safeParse({ ...valida, id_jogo_fk }).success);
  });

  it('não aceita id_usuario_fk do cliente: o autor sempre vem do token', () => {
    const r = avaliacaoBodySchema.parse({ ...valida, id_usuario_fk: 999 });
    assert.equal('id_usuario_fk' in r, false);
  });

  it('atualização: parcial, sem trocar o jogo, e nunca vazia', () => {
    assert.deepEqual(avaliacaoUpdateBodySchema.parse({ nota: 3 }), { nota: 3 });
    assert.deepEqual(avaliacaoUpdateBodySchema.parse({ nota: 3, id_jogo_fk: 9 }), { nota: 3 });
    assert.ok(!avaliacaoUpdateBodySchema.safeParse({}).success);
  });

  it('filtro jogo_id aceita inteiro positivo, é opcional e rejeita o resto', () => {
    assert.deepEqual(avaliacaoQuerySchema.parse({}), {});
    assert.equal(avaliacaoQuerySchema.parse({ jogo_id: '12' }).jogo_id, '12');
    for (const jogo_id of ['0', '-1', 'abc', '1.5', '', '01']) assert.ok(!avaliacaoQuerySchema.safeParse({ jogo_id }).success, `jogo_id "${jogo_id}"`);
  });
});

describe('jogo.schema', () => {
  const valido = { nome_jogo: 'Hades', desenvolvedora: 'Supergiant', data_lancamento: '2020-09-17', descricao: 'Roguelike.' };

  it('aceita um jogo válido e campos opcionais (capa nula, listas de ids)', () => {
    assert.ok(jogoBodySchema.safeParse(valido).success);
    assert.ok(jogoBodySchema.safeParse({ ...valido, capa: null, generos: ['1', 2], plataformas: [1] }).success);
  });

  it('rejeita data fora do formato ou inexistente no calendário', () => {
    for (const data_lancamento of ['17/09/2020', '2020-9-17', '2020-02-30', '2021-02-29', '2020-13-01', '']) {
      assert.ok(!jogoBodySchema.safeParse({ ...valido, data_lancamento }).success, `data "${data_lancamento}"`);
    }
  });

  it('data de 29/02 em ano bissexto é válida (caso de borda)', () => {
    assert.ok(jogoBodySchema.safeParse({ ...valido, data_lancamento: '2024-02-29' }).success);
  });

  it('rejeita strings vazias nos campos obrigatórios e capa vazia', () => {
    for (const campo of ['nome_jogo', 'desenvolvedora', 'descricao']) {
      assert.ok(!jogoBodySchema.safeParse({ ...valido, [campo]: '' }).success, campo);
    }
    assert.ok(!jogoBodySchema.safeParse({ ...valido, capa: '' }).success);
  });

  it('limita o nome a 200 caracteres', () => {
    assert.ok(jogoBodySchema.safeParse({ ...valido, nome_jogo: 'a'.repeat(200) }).success);
    assert.ok(!jogoBodySchema.safeParse({ ...valido, nome_jogo: 'a'.repeat(201) }).success);
  });

  it('rejeita ids de gênero/plataforma inválidos', () => {
    assert.ok(!jogoBodySchema.safeParse({ ...valido, generos: [0] }).success);
    assert.ok(!jogoBodySchema.safeParse({ ...valido, plataformas: ['x'] }).success);
  });

  it('atualização parcial não pode ser vazia', () => {
    assert.ok(jogoUpdateBodySchema.safeParse({ descricao: 'Nova' }).success);
    assert.ok(!jogoUpdateBodySchema.safeParse({}).success);
  });

  it('filtros de busca opcionais não aceitam string vazia', () => {
    assert.ok(jogoQuerySchema.safeParse({}).success);
    assert.ok(jogoQuerySchema.safeParse({ search: 'elden', genero: 'RPG', plataforma: 'PC' }).success);
    for (const campo of ['search', 'genero', 'plataforma']) assert.ok(!jogoQuerySchema.safeParse({ [campo]: '' }).success, campo);
  });
});

describe('contato.schema', () => {
  const valido = { email_contato: 'a@b.co', tipo: 'Dúvida', mensagem: 'Mensagem com mais de dez caracteres.' };

  it('aceita contato válido', () => assert.ok(contatoBodySchema.safeParse(valido).success));

  it('mensagem: 9 caracteres falha, 10 passa, 2001 falha (bordas)', () => {
    assert.ok(!contatoBodySchema.safeParse({ ...valido, mensagem: 'a'.repeat(9) }).success);
    assert.ok(contatoBodySchema.safeParse({ ...valido, mensagem: 'a'.repeat(10) }).success);
    assert.ok(contatoBodySchema.safeParse({ ...valido, mensagem: 'a'.repeat(2000) }).success);
    assert.ok(!contatoBodySchema.safeParse({ ...valido, mensagem: 'a'.repeat(2001) }).success);
  });

  it('rejeita e-mail inválido, tipo vazio e corpo vazio', () => {
    assert.ok(!contatoBodySchema.safeParse({ ...valido, email_contato: 'x' }).success);
    assert.ok(!contatoBodySchema.safeParse({ ...valido, tipo: '' }).success);
    assert.equal(erros(contatoBodySchema, {}).length, 3);
  });
});

describe('id-param.schema', () => {
  it('aceita inteiros positivos em string', () => {
    assert.equal(idParamSchema.parse({ id: '1' }).id, '1');
    assert.equal(idParamSchema.parse({ id: '9007199254740991' }).id, '9007199254740991');
  });

  it('rejeita zero, negativos, decimais, zeros à esquerda, espaços, texto e vazio', () => {
    for (const id of ['0', '-1', '1.5', '007', ' 1', '1 ', 'abc', '1e3', '', '%20']) {
      assert.ok(!idParamSchema.safeParse({ id }).success, `id "${id}"`);
    }
  });

  it('rejeita número fora do intervalo seguro e valor ausente', () => {
    assert.deepEqual(erros(idParamSchema, { id: '9007199254740993' }), ['id está fora do intervalo permitido']);
    assert.ok(!idParamSchema.safeParse({}).success);
  });
});

describe('catalog.schema', () => {
  it('nome com 2 a 60 caracteres', () => {
    for (const [schema, campo] of [[generoBodySchema, 'nome_genero'], [plataformaBodySchema, 'nome_plataforma'], [perfilBodySchema, 'nome_perfil']] as const) {
      assert.ok(schema.safeParse({ [campo]: 'ab' }).success, `${campo} 2`);
      assert.ok(schema.safeParse({ [campo]: 'a'.repeat(60) }).success, `${campo} 60`);
      assert.ok(!schema.safeParse({ [campo]: 'a' }).success, `${campo} 1`);
      assert.ok(!schema.safeParse({ [campo]: '' }).success, `${campo} vazio`);
      assert.ok(!schema.safeParse({ [campo]: 'a'.repeat(61) }).success, `${campo} 61`);
      assert.ok(!schema.safeParse({}).success, `${campo} ausente`);
    }
  });
});
