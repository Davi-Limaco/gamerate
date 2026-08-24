import { prisma } from '@/database/prisma.ts';
import seedersData from '@/database/seeders.json' with { type: 'json' };
import { hashPassword } from '@/utils/password.ts';

async function up() {
  await prisma.avaliacao.deleteMany();
  await prisma.jogoPlataforma.deleteMany();
  await prisma.jogoGenero.deleteMany();
  await prisma.jogo.deleteMany();
  await prisma.plataforma.deleteMany();
  await prisma.genero.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.perfil.deleteMany();

  const perfilIds: number[] = [];
  for (const data of seedersData.perfis) {
    const p = await prisma.perfil.create({ data });
    perfilIds.push(p.id_perfil);
  }

  const usuarioIds: number[] = [];
  for (const data of seedersData.usuarios) {
    const id_perfil_fk = perfilIds[(data.id_perfil_fk as number) - 1];
    const u = await prisma.usuario.create({ data: { nome_usuario: data.nome_usuario, email: data.email, senha: hashPassword(data.senha), id_perfil_fk } });
    usuarioIds.push(u.id_usuario);
  }

  const plataformaIds: number[] = [];
  for (const data of seedersData.plataformas) {
    const p = await prisma.plataforma.create({ data });
    plataformaIds.push(p.id_plataforma);
  }

  const generoIds: number[] = [];
  for (const data of seedersData.generos) {
    const g = await prisma.genero.create({ data });
    generoIds.push(g.id_genero);
  }

  for (const j of seedersData.jogos) {
    const jogo = await prisma.jogo.create({ data: { nome_jogo: j.nome_jogo, desenvolvedora: j.desenvolvedora, data_lancamento: new Date(j.data_lancamento), descricao: j.descricao, capa: j.capa ?? null, nota_media: j.nota_media ?? null, total_avaliacoes: j.total_avaliacoes ?? 0 } });

    if (j.generos && j.generos.length) {
      const mapped = j.generos.map((g: number) => ({ id_jogo_fk: jogo.id_jogo, id_genero_fk: generoIds[g - 1] }));
      await prisma.jogoGenero.createMany({ data: mapped });
    }

    if (j.plataformas && j.plataformas.length) {
      const mapped = j.plataformas.map((p: number) => ({ id_jogo_fk: jogo.id_jogo, id_plataforma_fk: plataformaIds[p - 1] }));
      await prisma.jogoPlataforma.createMany({ data: mapped });
    }
  }

  console.log('Seed concluído com sucesso.');
}

export default { up };

// Executa o seed quando o arquivo é executado diretamente
if (import.meta.main) {
  await up();
}
