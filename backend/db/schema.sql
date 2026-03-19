USE gamerate;

CREATE TABLE perfil (
    id_perfil INT AUTO_INCREMENT PRIMARY KEY,
    nome_perfil VARCHAR(50) NOT NULL
);

CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL,
    senha VARCHAR(200) NOT NULL,
    id_perfil_fk INT NOT NULL,
    data_criacao DATE NOT NULL,
    FOREIGN KEY (id_perfil_fk) REFERENCES perfil(id_perfil)
);

CREATE TABLE jogo (
    id_jogo INT AUTO_INCREMENT PRIMARY KEY,
    nome_jogo VARCHAR(200) NOT NULL,
    desenvolvedora VARCHAR(150) NOT NULL,
    data_lancamento DATE NOT NULL,
    descricao VARCHAR(1500) NOT NULL,
    nota_media DECIMAL(2,1),
    total_avaliacoes INT DEFAULT 0,
    capa VARCHAR(300)
);

CREATE TABLE plataforma (
    id_plataforma INT AUTO_INCREMENT PRIMARY KEY,
    nome_plataforma VARCHAR(60) NOT NULL
);

CREATE TABLE jogo_plataforma (
    id_jogo_fk INT NOT NULL,
    id_plataforma_fk INT NOT NULL,
    PRIMARY KEY (id_jogo_fk, id_plataforma_fk),
    FOREIGN KEY (id_jogo_fk) REFERENCES jogo(id_jogo),
    FOREIGN kEY (id_plataforma_fk) REFERENCES plataforma(id_plataforma)
);

CREATE TABLE genero (
    id_genero INT AUTO_INCREMENT PRIMARY KEY,
    nome_genero VARCHAR(50) NOT NULL
);

CREATE TABLE jogo_genero (
    id_jogo_fk INT NOT NULL,
    id_genero_fk INT NOT NULL,
    PRIMARY KEY (id_jogo_fk, id_genero_fk),
    FOREIGN KEY (id_jogo_fk) REFERENCES jogo(id_jogo),
    FOREIGN KEY (id_genero_fk) REFERENCES genero(id_genero)
);

CREATE TABLE avaliacao (
    id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_fk INT NOT NULL,
    id_jogo_fk INT NOT NULL,
    nota DECIMAL(2,1) CHECK (nota BETWEEN 1 AND 5),    
    titulo VARCHAR(200) NOT NULL,
    texto VARCHAR(2000) NOT NULL,
    data_publicacao DATE NOT NULL,
    FOREIGN KEY (id_usuario_fk) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_jogo_fk) REFERENCES jogo(id_jogo)
);

CREATE TABLE comentario (
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    id_avaliacao_fk INT NOT NULL,
    id_usuario_fk INT NOT NULL,
    texto VARCHAR(2000) NOT NULL,
    data_comentario DATE NOT NULL,
    FOREIGN KEY (id_avaliacao_fk) REFERENCES avaliacao(id_avaliacao),
    FOREIGN KEY (id_usuario_fk) REFERENCES usuario(id_usuario)
);

CREATE TABLE curtida (
    id_avaliacao_fk INT NOT NULL,
    id_usuario_fk INT NOT NULL,
    data_curtida DATE NOT NULL,
    PRIMARY KEY (id_avaliacao_fk, id_usuario_fk),
    FOREIGN KEY (id_avaliacao_fk) REFERENCES avaliacao(id_avaliacao),
    FOREIGN KEY (id_usuario_fk) REFERENCES usuario(id_usuario)
);

CREATE TABLE usuario_seguidor (
    id_seguidor_fk INT NOT NULL,
    id_usuario_fk INT NOT NULL,
    data_inicio DATE NOT NULL,
    PRIMARY KEY (id_seguidor_fk, id_usuario_fk),
    FOREIGN KEY (id_seguidor_fk) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_usuario_fk) REFERENCES usuario(id_usuario)
);

CREATE TABLE notificacao (
    id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    mensagem VARCHAR(2000) NOT NULL,
    data_envio DATE
);

CREATE TABLE notificacao_usuario (
    id_notificacao_fk INT NOT NULL,
    id_usuario_fk INT NOT NULL,
    lido BOOLEAN NOT NULL,
    data_visualizacao DATE,
    PRIMARY KEY (id_notificacao_fk, id_usuario_fk),
    FOREIGN KEY (id_notificacao_fk) REFERENCES notificacao(id_notificacao),
    FOREIGN KEY (id_usuario_fk) REFERENCES usuario(id_usuario)
);

CREATE TABLE comunicacao_site (
    id_comunicacao INT AUTO_INCREMENT PRIMARY KEY,
    email_contato VARCHAR(200) NOT NULL,
    tipo VARCHAR(200) NOT NULL,
    mensagem VARCHAR(2000) NOT NULL,
    data_comunicacao DATE NOT NULL
);

CREATE TABLE resposta_comunicacao (
    id_resposta INT AUTO_INCREMENT PRIMARY KEY,
    id_comunicacao_fk INT NOT NULL,
    id_usuario_fk INT NOT NULL,
    texto_resposta VARCHAR(2000) NOT NULL,
    data_resposta DATE NOT NULL,
    FOREIGN KEY (id_comunicacao_fk) REFERENCES comunicacao_site(id_comunicacao),
    FOREIGN KEY (id_usuario_fk) REFERENCES usuario(id_usuario)
);
