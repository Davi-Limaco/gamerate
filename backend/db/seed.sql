INSERT INTO perfil (nome_perfil) VALUES
  ('Jogador'),
  ('Crítico Especializado'),
  ('Administrador');

INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk, data_criacao) VALUES
  ('Admin', 'admin@gamerate.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
   3, CURDATE());

INSERT INTO plataforma (nome_plataforma) VALUES
  ('PC'), ('PlayStation 5'), ('PlayStation 4'),
  ('Xbox Series X'), ('Xbox One'), ('Nintendo Switch'),
  ('Android'), ('iOS'), ('PlayStation 3'), ('Xbox 360'),
  ('PlayStation 2'), ('Wii');

INSERT INTO genero (nome_genero) VALUES
  ('Ação'), ('RPG'), ('Aventura'), ('Terror'), ('Estratégia'),
  ('Simulação'), ('Esportes'), ('Luta'), ('Plataforma'),
  ('Corrida'), ('Puzzle'), ('Tiro');

INSERT INTO jogo (nome_jogo, desenvolvedora, data_lancamento, descricao, nota_media, total_avaliacoes) VALUES
  ('Elden Ring', 'FromSoftware', '2022-02-25',
   'Um RPG de ação ambientado nas Terras Intermédias, criado em colaboração com George R.R. Martin. Explore um vasto mundo aberto repleto de masmorras, chefes e segredos.',
   4.8, 0),
  ('God of War Ragnarök', 'Santa Monica Studio', '2022-11-09',
   'Kratos e Atreus embarcam em uma épica jornada pelos reinos nórdicos enquanto o Ragnarök se aproxima. Uma sequência que supera o original em emoção e escala.',
   4.9, 0),
  ('Baldur\'s Gate 3', 'Larian Studios', '2023-08-03',
   'O mais completo RPG de mesa digital já criado. Com roteiro ramificado, personagens profundos e combate tático, define um novo padrão para o gênero.',
   5.0, 0),
  ('Cyberpunk 2077', 'CD Projekt RED', '2020-12-10',
   'Uma epopeia cyberpunk em Night City, uma megalópole obcecada por poder e modificações corporais. Jogue como V em uma história de redenção e identidade.',
   4.5, 0),
  ('Hollow Knight', 'Team Cherry', '2017-02-24',
   'Um metroidvania desafiador e belíssimo ambientado em Hallownest, um reino subterrâneo de insetos. Arte manual, trilha sonora magistral e gameplay impecável.',
   4.7, 0),
  ('Red Dead Redemption 2', 'Rockstar Games', '2018-10-26',
   'Uma obra-prima ambientada no Velho Oeste americano. Arthur Morgan e o bando Van der Linde enfrentam o fim de uma era em uma das histórias mais emocionantes dos jogos.',
   4.9, 0),
  ('Hades', 'Supergiant Games', '2020-09-17',
   'Um roguelike de ação sobre Zagreus, filho de Hades, tentando escapar do submundo grego. Narrativa integrada ao gameplay de forma nunca vista no gênero.',
   4.8, 0),
  ('The Witcher 3: Wild Hunt', 'CD Projekt RED', '2015-05-19',
   'Geralt de Rívia em sua aventura mais épica, buscando sua filha adotiva Ciri. Um dos maiores RPGs de mundo aberto já criados, com quests memoráveis.',
   4.9, 0);

-- Associações jogo-gênero
INSERT INTO jogo_genero (id_jogo_fk, id_genero_fk) VALUES
  (1,1),(1,2), -- Elden Ring: Ação, RPG
  (2,1),(2,3), -- GoW: Ação, Aventura
  (3,2),(3,3), -- BG3: RPG, Aventura
  (4,2),(4,1), -- CP2077: RPG, Ação
  (5,2),(5,1), -- Hollow Knight: RPG, Ação
  (6,3),(6,1), -- RDR2: Aventura, Ação
  (7,1),(7,2), -- Hades: Ação, RPG
  (8,2),(8,3); -- Witcher 3: RPG, Aventura

-- Associações jogo-plataforma
INSERT INTO jogo_plataforma (id_jogo_fk, id_plataforma_fk) VALUES
  (1,1),(1,2),(1,3),(1,4),(1,5),
  (2,2),(2,3),
  (3,1),(3,2),
  (4,1),(4,2),(4,3),(4,4),(4,5),
  (5,1),(5,6),
  (6,1),(6,2),(6,3),(6,4),(6,5),
  (7,1),(7,2),(7,6),
  (8,1),(8,2),(8,3),(8,4),(8,5),(8,6);
