require('dotenv').config();
const mysql = require('mysql2/promise');

async function diagnostico() {
  console.log('\n====== DIAGNÓSTICO GAMERATE ======\n');

  console.log('Variáveis de ambiente:');
  console.log('  DB_HOST    :', process.env.DB_HOST     || '(não definido — usando localhost)');
  console.log('  DB_USER    :', process.env.DB_USER     || '(não definido — usando root)');
  console.log('  DB_PASSWORD:', process.env.DB_PASSWORD !== undefined ? '(definido)' : '⚠️  NÃO DEFINIDO');
  console.log('  DB_NAME    :', process.env.DB_NAME     || '(não definido — usando gamerate)');
  console.log('  DB_PORT    :', process.env.DB_PORT     || '(não definido — usando 3306)');
  console.log('  JWT_SECRET :', process.env.JWT_SECRET  ? '(definido)' : '⚠️  NÃO DEFINIDO');

  console.log('\n🔌 Testando conexão com MySQL...');
  let conn;
  try {
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'gamerate',
      port:     process.env.DB_PORT     || 3306,
    });
    console.log('Conexão bem-sucedida!\n');

    console.log('Verificando tabelas:');
    const tabelas = ['perfil','usuario','jogo','plataforma','genero','avaliacao','comentario','curtida'];
    for (const t of tabelas) {
      try {
        const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM ${t}`);
        console.log(`  ✅ ${t.padEnd(15)} — ${rows[0].total} registro(s)`);
      } catch(e) {
        console.log(`  ❌ ${t.padEnd(15)} — ERRO: ${e.message}`);
      }
    }

    console.log('\n👤 Perfis cadastrados:');
    const [perfis] = await conn.query('SELECT * FROM perfil');
    if (perfis.length === 0) {
      console.log(' NENHUM PERFIL — rode o seed.sql!');
    } else {
      perfis.forEach(p => console.log(` id=${p.id_perfil} → ${p.nome_perfil}`));
    }

    console.log('\n🔑 Usuário admin:');
    const [admins] = await conn.query(
      `SELECT u.id_usuario, u.nome_usuario, u.email, p.nome_perfil
       FROM usuario u JOIN perfil p ON p.id_perfil = u.id_perfil_fk
       WHERE p.nome_perfil = 'Administrador'`
    );
    if (admins.length === 0) {
      console.log(' Nenhum admin encontrado — rode o seed.sql!');
    } else {
      admins.forEach(a => console.log(` ${a.nome_usuario} (${a.email})`));
    }

    await conn.end();
  } catch(e) {
    console.log(` FALHA NA CONEXÃO: ${e.message}`);
  }

  console.log('\n==================================\n');
}

diagnostico();
