-- ═══════════════════════════════════════════════════════════════════
--  GameRate — testes_validacao.sql
--  Testa todas as restrições do schema para confirmar que funcionam
--  Execute no Supabase SQL Editor APÓS o schema.sql e seed.sql
--  Cada bloco deve retornar o erro esperado (não deve inserir)
-- ═══════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════
-- 1. NOT NULL — campo obrigatório não pode ser nulo
-- ════════════════════════════════════════════════════════════

-- TESTE 1.1: nome_usuario NULL → deve falhar
-- Esperado: ERROR: null value in column "nome_usuario"
DO $$
BEGIN
    INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk, data_criacao)
    VALUES (NULL, 'teste@email.com', 'hash_qualquer_123', 1, CURRENT_DATE);
    RAISE NOTICE 'FALHOU — deveria ter bloqueado nome_usuario NULL';
EXCEPTION WHEN not_null_violation THEN
    RAISE NOTICE 'PASSOU — NOT NULL nome_usuario funcionou corretamente';
END $$;

-- TESTE 1.2: email NULL → deve falhar
DO $$
BEGIN
    INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk, data_criacao)
    VALUES ('Teste', NULL, 'hash_qualquer_123', 1, CURRENT_DATE);
    RAISE NOTICE 'FALHOU — deveria ter bloqueado email NULL';
EXCEPTION WHEN not_null_violation THEN
    RAISE NOTICE 'PASSOU — NOT NULL email funcionou corretamente';
END $$;

-- TESTE 1.3: nota NULL em avaliação → deve falhar (nota é NOT NULL)
DO $$
BEGIN
    INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto, data_publicacao)
    VALUES (1, 1, NULL, 'Título válido', 'Texto com mais de quarenta caracteres obrigatório aqui.', CURRENT_DATE);
    RAISE NOTICE 'FALHOU — deveria ter bloqueado nota NULL';
EXCEPTION WHEN not_null_violation THEN
    RAISE NOTICE 'PASSOU — NOT NULL nota funcionou corretamente';
END $$;

-- TESTE 1.4: mensagem NULL em comunicacao_site → deve falhar
DO $$
BEGIN
    INSERT INTO comunicacao_site (email_contato, tipo, mensagem, data_comunicacao)
    VALUES ('user@email.com', 'Dúvida', NULL, CURRENT_DATE);
    RAISE NOTICE 'FALHOU — deveria ter bloqueado mensagem NULL';
EXCEPTION WHEN not_null_violation THEN
    RAISE NOTICE 'PASSOU — NOT NULL mensagem funcionou corretamente';
END $$;

-- ════════════════════════════════════════════════════════════
-- 2. UNIQUE — dados duplicados devem ser bloqueados
-- ════════════════════════════════════════════════════════════

-- TESTE 2.1: email duplicado → deve falhar
DO $$
BEGIN
    -- Insere o primeiro usuário
    INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk, data_criacao)
    VALUES ('Usuario Teste', 'duplicado@email.com', '$2a$10$hash_bcrypt_valido_aqui_123456', 1, CURRENT_DATE);

    -- Tenta inserir com o mesmo email
    INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk, data_criacao)
    VALUES ('Outro Usuario', 'duplicado@email.com', '$2a$10$outro_hash_bcrypt_valido_123', 1, CURRENT_DATE);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado email duplicado';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASSOU — UNIQUE email funcionou corretamente';
END $$;

-- TESTE 2.2: nome de perfil duplicado → deve falhar
DO $$
BEGIN
    INSERT INTO perfil (nome_perfil) VALUES ('Jogador');
    RAISE NOTICE 'FALHOU — deveria ter bloqueado perfil duplicado';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASSOU — UNIQUE perfil funcionou corretamente';
END $$;

-- TESTE 2.3: avaliação duplicada (mesmo usuário no mesmo jogo) → deve falhar
DO $$
DECLARE
    v_usuario_id INT;
    v_jogo_id    INT;
BEGIN
    SELECT id_usuario INTO v_usuario_id FROM usuario LIMIT 1;
    SELECT id_jogo    INTO v_jogo_id    FROM jogo    LIMIT 1;

    -- Insere primeira avaliação
    INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto, data_publicacao)
    VALUES (v_usuario_id, v_jogo_id, 4.0,
            'Primeira Avaliação',
            'Texto com mais de quarenta caracteres para passar na validação do check.',
            CURRENT_DATE)
    ON CONFLICT DO NOTHING;

    -- Tenta segunda avaliação do mesmo usuário no mesmo jogo
    INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto, data_publicacao)
    VALUES (v_usuario_id, v_jogo_id, 3.0,
            'Segunda Avaliação Duplicada',
            'Texto com mais de quarenta caracteres para passar na validação do check.',
            CURRENT_DATE);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado avaliação duplicada';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASSOU — UNIQUE avaliacao (usuario+jogo) funcionou corretamente';
END $$;

-- TESTE 2.4: nome de gênero duplicado → deve falhar
DO $$
BEGIN
    INSERT INTO genero (nome_genero) VALUES ('Ação');
    RAISE NOTICE 'FALHOU — deveria ter bloqueado gênero duplicado';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASSOU — UNIQUE genero funcionou corretamente';
END $$;

-- TESTE 2.5: nome de plataforma duplicado → deve falhar
DO $$
BEGIN
    INSERT INTO plataforma (nome_plataforma) VALUES ('PC');
    RAISE NOTICE 'FALHOU — deveria ter bloqueado plataforma duplicada';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASSOU — UNIQUE plataforma funcionou corretamente';
END $$;

-- ════════════════════════════════════════════════════════════
-- 3. CHECK — regras de negócio validadas no banco
-- ════════════════════════════════════════════════════════════

-- TESTE 3.1: nota abaixo do mínimo (< 1.0) → deve falhar
DO $$
DECLARE
    v_usuario_id INT;
    v_jogo_id    INT;
BEGIN
    SELECT id_usuario INTO v_usuario_id FROM usuario WHERE email = 'admin@gamerate.com';
    SELECT id_jogo    INTO v_jogo_id    FROM jogo    LIMIT 1;

    INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto, data_publicacao)
    VALUES (v_usuario_id, v_jogo_id, 0.5,
            'Nota inválida abaixo',
            'Texto com mais de quarenta caracteres para passar na validação.',
            CURRENT_DATE);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado nota 0.5';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSOU — CHECK nota mínima (1.0) funcionou corretamente';
END $$;

-- TESTE 3.2: nota acima do máximo (> 5.0) → deve falhar
DO $$
DECLARE
    v_usuario_id INT;
    v_jogo_id    INT;
BEGIN
    SELECT id_usuario INTO v_usuario_id FROM usuario WHERE email = 'admin@gamerate.com';
    SELECT id_jogo    INTO v_jogo_id    FROM jogo LIMIT 1;

    INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto, data_publicacao)
    VALUES (v_usuario_id, v_jogo_id, 6.0,
            'Nota inválida acima',
            'Texto com mais de quarenta caracteres para passar na validação.',
            CURRENT_DATE);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado nota 6.0';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSOU — CHECK nota máxima (5.0) funcionou corretamente';
END $$;

-- TESTE 3.3: texto da avaliação muito curto (< 40 chars) → deve falhar
DO $$
DECLARE
    v_usuario_id INT;
    v_jogo_id    INT;
BEGIN
    SELECT id_usuario INTO v_usuario_id FROM usuario WHERE email = 'admin@gamerate.com';
    SELECT id_jogo    INTO v_jogo_id    FROM jogo LIMIT 1;

    INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto, data_publicacao)
    VALUES (v_usuario_id, v_jogo_id, 4.0, 'Título', 'Texto curto.', CURRENT_DATE);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado texto curto';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSOU — CHECK texto mínimo (40 chars) funcionou corretamente';
END $$;

-- TESTE 3.4: email com formato inválido → deve falhar
DO $$
BEGIN
    INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk, data_criacao)
    VALUES ('Teste', 'email-invalido-sem-arroba', '$2a$10$hash_bcrypt_valido_aqui_123456', 1, CURRENT_DATE);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado email sem @';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSOU — CHECK formato de email funcionou corretamente';
END $$;

-- TESTE 3.5: tipo de comunicacao inválido → deve falhar
DO $$
BEGIN
    INSERT INTO comunicacao_site (email_contato, tipo, mensagem, data_comunicacao)
    VALUES ('valido@email.com', 'TipoInexistente', 'Mensagem com pelo menos dez caracteres.', CURRENT_DATE);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado tipo inválido';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSOU — CHECK tipo comunicacao funcionou corretamente';
END $$;

-- TESTE 3.6: usuário tentando seguir a si mesmo → deve falhar
DO $$
DECLARE
    v_usuario_id INT;
BEGIN
    SELECT id_usuario INTO v_usuario_id FROM usuario LIMIT 1;

    INSERT INTO usuario_seguidor (id_seguidor_fk, id_usuario_fk, data_inicio)
    VALUES (v_usuario_id, v_usuario_id, CURRENT_DATE);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado auto-follow';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSOU — CHECK seguidor diferente funcionou corretamente';
END $$;

-- TESTE 3.7: nome_usuario com menos de 3 caracteres → deve falhar
DO $$
BEGIN
    INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk, data_criacao)
    VALUES ('AB', 'curto@email.com', '$2a$10$hash_bcrypt_valido_aqui_123456', 1, CURRENT_DATE);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado nome com menos de 3 chars';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSOU — CHECK nome_usuario mínimo (3 chars) funcionou corretamente';
END $$;

-- TESTE 3.8: nota_media de jogo fora do intervalo → deve falhar
DO $$
BEGIN
    INSERT INTO jogo (nome_jogo, desenvolvedora, data_lancamento, descricao, nota_media)
    VALUES ('Jogo Inválido', 'Dev Teste', CURRENT_DATE, 'Descrição com mais de dez caracteres.', 9.9);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado nota_media > 5.0';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSOU — CHECK nota_media (0.0–5.0) funcionou corretamente';
END $$;

-- ════════════════════════════════════════════════════════════
-- 4. FOREIGN KEY — integridade referencial
-- ════════════════════════════════════════════════════════════

-- TESTE 4.1: criar usuário com perfil inexistente → deve falhar
DO $$
BEGIN
    INSERT INTO usuario (nome_usuario, email, senha, id_perfil_fk, data_criacao)
    VALUES ('Usuario FK', 'fk@email.com', '$2a$10$hash_bcrypt_valido_aqui_123456', 999, CURRENT_DATE);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado perfil inexistente';
EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASSOU — FOREIGN KEY id_perfil_fk funcionou corretamente';
END $$;

-- TESTE 4.2: criar avaliação para jogo inexistente → deve falhar
DO $$
DECLARE
    v_usuario_id INT;
BEGIN
    SELECT id_usuario INTO v_usuario_id FROM usuario LIMIT 1;

    INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto, data_publicacao)
    VALUES (v_usuario_id, 99999, 4.0,
            'Jogo Inexistente',
            'Texto com mais de quarenta caracteres para passar na validação.',
            CURRENT_DATE);

    RAISE NOTICE 'FALHOU — deveria ter bloqueado jogo inexistente';
EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASSOU — FOREIGN KEY id_jogo_fk funcionou corretamente';
END $$;

-- TESTE 4.3: excluir perfil que tem usuários vinculados → deve falhar (RESTRICT)
DO $$
BEGIN
    DELETE FROM perfil WHERE nome_perfil = 'Jogador';
    RAISE NOTICE 'FALHOU — deveria ter bloqueado exclusão de perfil com usuários';
EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASSOU — FOREIGN KEY ON DELETE RESTRICT (perfil) funcionou corretamente';
END $$;

-- TESTE 4.4: excluir plataforma vinculada a jogos → deve falhar (RESTRICT)
DO $$
BEGIN
    DELETE FROM plataforma WHERE nome_plataforma = 'PC';
    RAISE NOTICE 'FALHOU — deveria ter bloqueado exclusão de plataforma com jogos';
EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASSOU — FOREIGN KEY ON DELETE RESTRICT (plataforma) funcionou corretamente';
END $$;

-- TESTE 4.5: CASCADE — excluir jogo deve excluir avaliações associadas
DO $$
DECLARE
    v_jogo_id     INT;
    v_aval_antes  INT;
    v_aval_depois INT;
BEGIN
    -- Insere jogo temporário
    INSERT INTO jogo (nome_jogo, desenvolvedora, data_lancamento, descricao)
    VALUES ('Jogo Temporário CASCADE', 'Dev Teste', CURRENT_DATE, 'Descrição de teste com dez chars.')
    RETURNING id_jogo INTO v_jogo_id;

    -- Insere avaliação para esse jogo
    INSERT INTO avaliacao (id_usuario_fk, id_jogo_fk, nota, titulo, texto, data_publicacao)
    SELECT id_usuario, v_jogo_id, 3.0,
           'Avaliação Temporária',
           'Texto com mais de quarenta caracteres para validação do check.',
           CURRENT_DATE
    FROM usuario LIMIT 1;

    SELECT COUNT(*)::int INTO v_aval_antes FROM avaliacao WHERE id_jogo_fk = v_jogo_id;

    -- Exclui o jogo
    DELETE FROM jogo WHERE id_jogo = v_jogo_id;

    SELECT COUNT(*)::int INTO v_aval_depois FROM avaliacao WHERE id_jogo_fk = v_jogo_id;

    IF v_aval_antes > 0 AND v_aval_depois = 0 THEN
        RAISE NOTICE 'PASSOU — CASCADE ao excluir jogo removeu % avaliação(ões) corretamente', v_aval_antes;
    ELSE
        RAISE NOTICE 'FALHOU — CASCADE não funcionou (antes: %, depois: %)', v_aval_antes, v_aval_depois;
    END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- 5. RESUMO FINAL
-- ════════════════════════════════════════════════════════════
DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE 'Testes de validação concluídos.';
    RAISE NOTICE 'Verifique acima se todos retornaram PASSOU.';
    RAISE NOTICE 'Mensagens FALHOU indicam restrições não aplicadas.';
    RAISE NOTICE '════════════════════════════════════════';
END $$;


-- ════════════════════════════════════════════════════════════
-- 6. TRATAMENTO DE ERROS — respostas corretas da API
-- ════════════════════════════════════════════════════════════
-- Estes testes verificam que o sistema responde com os
-- códigos HTTP corretos para cada tipo de erro.
-- Execute via curl ou Postman com o servidor rodando.

-- TESTE 6.1: Cadastro com campos faltando → 400 Bad Request
-- curl -X POST http://localhost:3001/api/auth/cadastro \
--   -H "Content-Type: application/json" \
--   -d '{"email":"teste@email.com"}' 
-- Esperado: {"erro":"Preencha todos os campos"} — HTTP 400

-- TESTE 6.2: Login com credenciais erradas → 401 Unauthorized  
-- curl -X POST http://localhost:3001/api/auth/login \
--   -H "Content-Type: application/json" \
--   -d '{"email":"naoexiste@email.com","senha":"qualquer"}'
-- Esperado: {"erro":"Credenciais inválidas"} — HTTP 401

-- TESTE 6.3: Rota protegida sem token → 401 Unauthorized
-- curl http://localhost:3001/api/usuarios/me
-- Esperado: {"erro":"Token não fornecido"} — HTTP 401

-- TESTE 6.4: Jogo inexistente → 404 Not Found
-- curl http://localhost:3001/api/jogos/99999
-- Esperado: {"erro":"Jogo não encontrado"} — HTTP 404

-- TESTE 6.5: Email duplicado → 409 Conflict
-- (cadastrar o mesmo email duas vezes)
-- Esperado: {"erro":"Este e-mail já está cadastrado"} — HTTP 409

-- TESTE 6.6: Avaliação duplicada → 409 Conflict
-- (avaliar o mesmo jogo duas vezes com o mesmo usuário)
-- Esperado: {"erro":"Você já avaliou este jogo"} — HTTP 409

-- TESTE 6.7: Nota fora do range → 400 Bad Request
-- curl -X POST http://localhost:3001/api/avaliacoes \
--   -H "Authorization: Bearer TOKEN" \
--   -d '{"id_jogo_fk":1,"nota":8,"titulo":"X","texto":"..."}'
-- Esperado: {"erro":"Nota deve ser um valor entre 1.0 e 5.0"} — HTTP 400

-- TESTE 6.8: Texto de avaliação curto → 400 Bad Request
-- Esperado: {"erro":"Texto deve ter no mínimo 40 caracteres"} — HTTP 400

-- TESTE 6.9: Tipo de contato inválido → 400 Bad Request
-- curl -X POST http://localhost:3001/api/contato \
--   -d '{"email_contato":"a@b.com","tipo":"TipoErrado","mensagem":"texto longo..."}'
-- Esperado: {"erro":"Tipo deve ser: Dúvida, Denúncia, Erro ou Sugestão"} — HTTP 400

-- TESTE 6.10: Excluir jogo com avaliações → 409 Conflict
-- curl -X DELETE http://localhost:3001/api/jogos/1 \
--   -H "Authorization: Bearer ADMIN_TOKEN"
-- Esperado: {"erro":"Jogo possui avaliações e não pode ser excluído"} — HTTP 409
