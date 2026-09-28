import { PrismaClient } from '@prisma/client';
import process from 'node:process';
import seedData from '../src/database/seeders.json' with { type: 'json' };
import { hashPassword } from '../src/utils/password.ts';

const prisma = new PrismaClient();
const avaliadores = [
  { nome: 'Ana Martins', email: 'ana.martins@gamerate.dev', nota: 5, titulo: 'Uma experiência marcante', texto: 'A direção de arte e a trilha sonora criam uma atmosfera que prende do começo ao fim.' },
  { nome: 'Bruno Costa', email: 'bruno.costa@gamerate.dev', nota: 4.5, titulo: 'Muito divertido', texto: 'A jogabilidade é envolvente e recompensa quem explora cada detalhe do mundo.' },
  { nome: 'Camila Rocha', email: 'camila.rocha@gamerate.dev', nota: 4, titulo: 'Vale a jornada', texto: 'Tem ritmo consistente, bons desafios e momentos que ficam na memória depois de jogar.' },
  { nome: 'Daniel Souza', email: 'daniel.souza@gamerate.dev', nota: 4.5, titulo: 'Recomendado', texto: 'O conjunto funciona muito bem e oferece conteúdo suficiente para várias horas.' },
  { nome: 'Eduarda Lima', email: 'eduarda.lima@gamerate.dev', nota: 5, titulo: 'Excelente do início ao fim', texto: 'Personagens interessantes e sistemas bem construídos tornam a experiência especial.' },
  { nome: 'Felipe Alves', email: 'felipe.alves@gamerate.dev', nota: 3.5, titulo: 'Bom, com ressalvas', texto: 'Gostei bastante da proposta, embora alguns trechos pudessem ter mais variedade.' },
  { nome: 'Gabriela Nunes', email: 'gabriela.nunes@gamerate.dev', nota: 4, titulo: 'Uma ótima surpresa', texto: 'A ambientação chama atenção e o ciclo de jogo mantém a vontade de continuar.' },
  { nome: 'Henrique Melo', email: 'henrique.melo@gamerate.dev', nota: 4.5, titulo: 'Diversão garantida', texto: 'Os controles respondem bem e os desafios aumentam de forma satisfatória.' },
  { nome: 'Isabela Freitas', email: 'isabela.freitas@gamerate.dev', nota: 5, titulo: 'Um dos meus favoritos', texto: 'É fácil se envolver com a história e querer descobrir tudo o que o jogo esconde.' },
  { nome: 'João Ribeiro', email: 'joao.ribeiro@gamerate.dev', nota: 4, titulo: 'Recomendo para fãs do gênero', texto: 'Entrega uma experiência sólida, com boas ideias e bastante personalidade.' },
];

async function seed() {
  for (const perfil of seedData.perfis) {
    await prisma.perfil.upsert({
      where: { nome_perfil: perfil.nome_perfil },
      update: {},
      create: { nome_perfil: perfil.nome_perfil },
    });
  }

  // As contas de demonstração também seguem a regra do projeto: senha nunca
  // em texto puro. O `update` regrava o hash para migrar bancos antigos, que
  // ainda tinham essas senhas em texto puro.
  const perfilAdmin = await prisma.perfil.findUniqueOrThrow({ where: { nome_perfil: 'Administrador' } });
  const senhaAdminHash = await hashPassword('admin123');
  await prisma.usuario.upsert({
    where: { email: 'admin@gamerate.com' },
    update: { nome_usuario: 'Admin', id_perfil_fk: perfilAdmin.id_perfil, senha: senhaAdminHash },
    create: {
      nome_usuario: 'Admin',
      email: 'admin@gamerate.com',
      senha: senhaAdminHash,
      id_perfil_fk: perfilAdmin.id_perfil,
      data_criacao: new Date(),
    },
  });

  for (const plataforma of seedData.plataformas) {
    await prisma.plataforma.upsert({
      where: { nome_plataforma: plataforma.nome_plataforma },
      update: {},
      create: { nome_plataforma: plataforma.nome_plataforma },
    });
  }

  for (const genero of seedData.generos) {
    await prisma.genero.upsert({
      where: { nome_genero: genero.nome_genero },
      update: {},
      create: { nome_genero: genero.nome_genero },
    });
  }

  for (const jogoData of seedData.jogos) {
    const generoNomes = jogoData.generos.map((id) => seedData.generos[id - 1]?.nome_genero).filter((nome): nome is string => Boolean(nome));
    const plataformaNomes = jogoData.plataformas.map((id) => seedData.plataformas[id - 1]?.nome_plataforma).filter((nome): nome is string => Boolean(nome));
    const [generos, plataformas] = await Promise.all([
      prisma.genero.findMany({ where: { nome_genero: { in: generoNomes } }, select: { id_genero: true } }),
      prisma.plataforma.findMany({ where: { nome_plataforma: { in: plataformaNomes } }, select: { id_plataforma: true } }),
    ]);
    const fields = {
      nome_jogo: jogoData.nome_jogo,
      desenvolvedora: jogoData.desenvolvedora,
      data_lancamento: new Date(`${jogoData.data_lancamento}T00:00:00.000Z`),
      descricao: jogoData.descricao,
      capa: jogoData.capa ?? null,
    };
    const existente = await prisma.jogo.findFirst({ where: { nome_jogo: jogoData.nome_jogo }, select: { id_jogo: true } });

    if (existente) {
      await prisma.$transaction(async (tx) => {
        await tx.jogo.update({ where: { id_jogo: existente.id_jogo }, data: fields });
        await tx.jogoGenero.deleteMany({ where: { id_jogo_fk: existente.id_jogo } });
        await tx.jogoPlataforma.deleteMany({ where: { id_jogo_fk: existente.id_jogo } });
        if (generos.length) {
          await tx.jogoGenero.createMany({ data: generos.map(({ id_genero }) => ({ id_jogo_fk: existente.id_jogo, id_genero_fk: id_genero })) });
        }
        if (plataformas.length) {
          await tx.jogoPlataforma.createMany({ data: plataformas.map(({ id_plataforma }) => ({ id_jogo_fk: existente.id_jogo, id_plataforma_fk: id_plataforma })) });
        }
      });
    } else {
      await prisma.jogo.create({
        data: {
          ...fields,
          generos: { create: generos.map(({ id_genero }) => ({ genero: { connect: { id_genero } } })) },
          plataformas: { create: plataformas.map(({ id_plataforma }) => ({ plataforma: { connect: { id_plataforma } } })) },
        },
      });
    }
  }

  const perfilJogador = await prisma.perfil.findUniqueOrThrow({ where: { nome_perfil: 'Jogador' } });
  const senhaAvaliadorHash = await hashPassword('avaliador123');
  const usuariosAvaliadores = await Promise.all(avaliadores.map((avaliador) =>
    prisma.usuario.upsert({
      where: { email: avaliador.email },
      update: { senha: senhaAvaliadorHash },
      create: {
        nome_usuario: avaliador.nome,
        email: avaliador.email,
        senha: senhaAvaliadorHash,
        id_perfil_fk: perfilJogador.id_perfil,
        data_criacao: new Date(),
      },
      select: { id_usuario: true },
    }),
  ));

  const jogos = await prisma.jogo.findMany({ select: { id_jogo: true, nome_jogo: true }, orderBy: { id_jogo: 'asc' } });
  for (const [jogoIndex, jogo] of jogos.entries()) {
    for (const [avaliadorIndex, avaliador] of avaliadores.entries()) {
      const id_usuario_fk = usuariosAvaliadores[avaliadorIndex].id_usuario;
      await prisma.avaliacao.upsert({
        where: { id_usuario_fk_id_jogo_fk: { id_usuario_fk, id_jogo_fk: jogo.id_jogo } },
        update: {},
        create: {
          id_usuario_fk,
          id_jogo_fk: jogo.id_jogo,
          nota: Math.max(1, Math.min(5, avaliador.nota + ((jogoIndex + avaliadorIndex) % 3 - 1) * 0.5)),
          titulo: `${jogo.nome_jogo}: ${avaliador.titulo}`,
          texto: avaliador.texto,
          data_publicacao: new Date(Date.UTC(2025, 0, 1 + avaliadorIndex)),
        },
      });
    }

    const aggregate = await prisma.avaliacao.aggregate({
      where: { id_jogo_fk: jogo.id_jogo },
      _avg: { nota: true },
      _count: { _all: true },
    });
    await prisma.jogo.update({
      where: { id_jogo: jogo.id_jogo },
      data: { nota_media: aggregate._avg.nota, total_avaliacoes: aggregate._count._all },
    });
  }

  console.log(`Seed concluído: ${jogos.length} jogos com pelo menos 10 avaliações cada.`);
}

seed()
  .catch((error: unknown) => {
    console.error('Falha ao executar seed:', error);
    throw error;
  })
  .finally(async () => prisma.$disconnect());
