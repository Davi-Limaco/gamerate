-- ═══════════════════════════════════════════════
--  GameRate — seed.sql (PostgreSQL / Supabase)
-- ═══════════════════════════════════════════════

-- Perfis
INSERT INTO perfil (nome_perfil) VALUES
  ('Jogador'),
  ('Crítico Especializado'),
  ('Administrador')
ON CONFLICT DO NOTHING;

-- Admin (senha: admin123)
INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk, data_criacao)
SELECT 'Admin','admin@gamerate.com',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       id_perfil, CURRENT_DATE
FROM perfil WHERE nome_perfil = 'Administrador'
ON CONFLICT (email) DO NOTHING;

-- Plataformas
INSERT INTO plataforma (nome_plataforma) VALUES
  ('PC'),('PlayStation 5'),('PlayStation 4'),
  ('Xbox Series X'),('Xbox One'),('Nintendo Switch'),
  ('Android'),('iOS'),('PlayStation 3'),('Xbox 360'),
  ('PlayStation 2'),('Wii'),('PlayStation Vita'),
  ('Nintendo 3DS'),('Stadia')
ON CONFLICT DO NOTHING;

-- Gêneros
INSERT INTO genero (nome_genero) VALUES
  ('Ação'),('RPG'),('Aventura'),('Terror'),('Estratégia'),
  ('Simulação'),('Esportes'),('Luta'),('Plataforma'),
  ('Corrida'),('Puzzle'),('Tiro'),('Roguelike'),
  ('Metroidvania'),('Survival Horror')
ON CONFLICT DO NOTHING;

-- Jogos
INSERT INTO jogo (nome_jogo, desenvolvedora, data_lancamento, descricao, nota_media, total_avaliacoes, capa) VALUES
('Elden Ring','FromSoftware','2022-02-25','Um RPG de ação ambientado nas Terras Intermédias, criado em colaboração com George R.R. Martin. Explore um vasto mundo aberto repleto de masmorras, chefes e segredos.',4.8,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp'),
('God of War Ragnarök','Santa Monica Studio','2022-11-09','Kratos e Atreus embarcam em uma épica jornada pelos reinos nórdicos enquanto o Ragnarök se aproxima.',4.9,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.webp'),
('Baldur''s Gate 3','Larian Studios','2023-08-03','O mais completo RPG de mesa digital já criado. Com roteiro ramificado, personagens profundos e combate tático.',5.0,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co6lrg.webp'),
('Cyberpunk 2077','CD Projekt RED','2020-12-10','Uma epopeia cyberpunk em Night City, uma megalópole obcecada por poder e modificações corporais.',4.5,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hna.webp'),
('Hollow Knight','Team Cherry','2017-02-24','Um metroidvania desafiador e belíssimo ambientado em Hallownest, um reino subterrâneo de insetos.',4.7,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.webp'),
('Red Dead Redemption 2','Rockstar Games','2018-10-26','Uma obra-prima ambientada no Velho Oeste americano. Arthur Morgan e o bando Van der Linde enfrentam o fim de uma era.',4.9,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.webp'),
('Hades','Supergiant Games','2020-09-17','Um roguelike de ação sobre Zagreus, filho de Hades, tentando escapar do submundo grego.',4.8,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tud.webp'),
('The Witcher 3: Wild Hunt','CD Projekt RED','2015-05-19','Geralt de Rívia em sua aventura mais épica, buscando sua filha adotiva Ciri.',4.9,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.webp'),
('The Last of Us Part II','Naughty Dog','2020-06-19','Ellie embarca em uma jornada brutal e emocionalmente devastadora em busca de justiça.',4.8,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co5wx5.webp'),
('Dark Souls III','FromSoftware','2016-04-12','O capítulo final da saga Dark Souls. Um RPG de ação desafiador com level design magistral.',4.7,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co1vcf.webp'),
('Sekiro: Shadows Die Twice','FromSoftware','2019-03-22','Um shinobi desonrado busca resgatar seu senhor e recuperar sua honra no Japão feudal.',4.8,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co1mte.webp'),
('Persona 5 Royal','Atlus','2019-10-31','Um grupo de estudantes se torna ladrões fantasmas para mudar o coração de adultos corruptos.',4.9,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co1zzo.webp'),
('Death Stranding','Kojima Productions','2019-11-08','Sam Porter Bridges atravessa uma América pós-apocalíptica para reconectar a civilização.',4.3,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7b.webp'),
('Ghost of Tsushima','Sucker Punch Productions','2020-07-17','Jin Sakai defende a ilha de Tsushima de uma invasão mongol.',4.7,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co4416.webp'),
('Disco Elysium','ZA/UM','2019-10-15','Um detetive com amnésia investiga um assassinato em uma cidade decadente.',4.6,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co1sfr.webp'),
('Resident Evil Village','Capcom','2021-05-07','Ethan Winters chega a uma aldeia europeia misteriosa para resgatar sua filha.',4.5,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co4sbk.webp'),
('Horizon Forbidden West','Guerrilla Games','2022-02-18','Aloy explora territórios selvagens do oeste americano para investigar uma praga mortal.',4.5,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp'),
('Spider-Man: Miles Morales','Insomniac Games','2020-11-12','Miles Morales assume o manto do Homem-Aranha para proteger Harlem.',4.6,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co4812.webp'),
('It Takes Two','Hazelight Studios','2021-03-26','Um casal à beira do divórcio é transformado em bonecos e precisa cooperar para voltar ao normal.',4.9,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co2cb5.webp'),
('Metroid Dread','MercurySteam','2021-10-08','Samus Aran explora um planeta perigoso enquanto é caçada por robôs indestrutíveis chamados E.M.M.I.',4.6,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co4xoo.webp'),
('Returnal','Housemarque','2021-04-30','Selene fica presa em loop temporal em um planeta alienígena hostil.',4.4,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co2ved.webp'),
('Stardew Valley','ConcernedApe','2016-02-26','Herde a fazenda do seu avô e construa uma nova vida no campo.',4.8,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tgt.webp'),
('Celeste','Maddy Makes Games','2018-01-25','Madeline escala uma montanha misteriosa enquanto enfrenta seus próprios demônios internos.',4.9,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co1nf7.webp'),
('Deathloop','Arkane Studios','2021-09-14','Colt está preso em um loop temporal em uma ilha e precisa eliminar oito alvos antes da meia-noite.',4.4,1,'https://images.igdb.com/igdb/image/upload/t_cover_big/co2nit.webp');
