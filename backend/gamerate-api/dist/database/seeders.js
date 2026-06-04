import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import Perfil from '@/models/Perfil';
import Usuario from '@/models/Usuario';
import { Genero, Plataforma } from '@/models/Categoria';
import Jogo from '@/models/Jogo';
async function up() {
    const file = resolve('src', 'database', 'seeders.json');
    const seed = JSON.parse(readFileSync(file, 'utf-8'));
    try {
        for (const perfil of seed.perfis)
            await Perfil.create(perfil);
        for (const usuario of seed.usuarios)
            await Usuario.create(usuario);
        for (const plataforma of seed.plataformas)
            await Plataforma.create(plataforma);
        for (const genero of seed.generos)
            await Genero.create(genero);
        for (const j of seed.jogos) {
            await Jogo.create({
                nome_jogo: j.nome_jogo,
                desenvolvedora: j.desenvolvedora,
                data_lancamento: j.data_lancamento,
                descricao: j.descricao,
                capa: j.capa,
                generos: j.generos || [],
                plataformas: j.plataformas || [],
            });
        }
        console.log('Seed concluído com sucesso.');
    }
    catch (error) {
        console.error('Erro durante seed:', error instanceof Error ? error.message : String(error));
    }
}
export default { up };
