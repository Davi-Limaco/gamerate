import Perfil    from '@/models/perfil.model.js';
import Usuario   from '@/models/usuario.model.js';
import { Genero, Plataforma } from '@/models/categoria.model.js';
import Jogo      from '@/models/jogo.model.js';
import seedersData from '@/database/seeders.json' with { type: 'json' };

async function up() {
  for (const data of seedersData.perfis)     await Perfil.create(data);
  for (const data of seedersData.usuarios)   await Usuario.create(data);
  for (const data of seedersData.plataformas) await Plataforma.create(data);
  for (const data of seedersData.generos)    await Genero.create(data);

  for (const j of seedersData.jogos) {
    await Jogo.create({
      nome_jogo:       j.nome_jogo,
      desenvolvedora:  j.desenvolvedora,
      data_lancamento: j.data_lancamento,
      descricao:       j.descricao,
      capa:            j.capa ?? null,
      generos:         j.generos    ?? [],
      plataformas:     j.plataformas ?? [],
    });
  }

  console.log('Seed concluído com sucesso.');
}

export default { up };
