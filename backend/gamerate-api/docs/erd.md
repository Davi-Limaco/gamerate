# Diagrama ERD — GameRate API

Diagrama de Entidade-Relacionamento do banco de dados SQLite da aplicação GameRate.

```mermaid
erDiagram
    PERFIL ||--o{ USUARIO : "possui"
    USUARIO ||--o{ AVALIACAO : "faz"
    JOGO ||--o{ AVALIACAO : "recebe"
    JOGO }o--|| JOGO_GENERO : "tem"
    GENERO }o--|| JOGO_GENERO : "classifica"
    JOGO }o--|| JOGO_PLATAFORMA : "disponivel_em"
    PLATAFORMA }o--|| JOGO_PLATAFORMA : "hospeda"

    PERFIL {
        int id_perfil PK
        string nome_perfil UK
    }

    USUARIO {
        int id_usuario PK
        string nome_usuario
        string email UK
        string senha
        int id_perfil_fk FK
        date data_criacao
    }

    JOGO {
        int id_jogo PK
        string nome_jogo
        string desenvolvedora
        date data_lancamento
        string descricao
        real nota_media
        int total_avaliacoes
        string capa
    }

    AVALIACAO {
        int id_avaliacao PK
        int id_usuario_fk FK
        int id_jogo_fk FK
        real nota
        string titulo
        string texto
        date data_publicacao
    }

    GENERO {
        int id_genero PK
        string nome_genero UK
    }

    JOGO_GENERO {
        int id_jogo_fk FK
        int id_genero_fk FK
    }

    PLATAFORMA {
        int id_plataforma PK
        string nome_plataforma UK
    }

    JOGO_PLATAFORMA {
        int id_jogo_fk FK
        int id_plataforma_fk FK
    }

    COMUNICACAO_SITE {
        int id_comunicacao PK
        string email_contato
        string tipo
        string mensagem
        date data_comunicacao
    }
```

## Explicação dos Relacionamentos

### Relacionamentos 1:N (Um-para-Muitos)
- **PERFIL → USUARIO** (1:N): Um perfil pode estar associado a vários usuários.
- **USUARIO → AVALIACAO** (1:N): Um usuário pode fazer várias avaliações.
- **JOGO → AVALIACAO** (1:N): Um jogo pode receber várias avaliações.

### Relacionamentos N:N (Muitos-para-Muitos)
- **JOGO ↔ GENERO** (N:N via JOGO_GENERO): Um jogo pode ter vários gêneros; um gênero pode classificar vários jogos.
- **JOGO ↔ PLATAFORMA** (N:N via JOGO_PLATAFORMA): Um jogo pode estar disponível em várias plataformas; uma plataforma pode hospedar vários jogos.

### Entidade Independente
- **COMUNICACAO_SITE**: Formulário de contato público, sem relacionamentos com outras tabelas.

## Restrições de Integridade

- **Chaves Primárias (PK)**: Identificam unicamente cada registro.
- **Chaves Estrangeiras (FK)**: Garantem referência a registros existentes em outras tabelas.
- **Unique (UK)**: Impedem duplicação de certos campos (`email`, `nome_perfil`, `nome_genero`, `nome_plataforma`).

### Restrições Compostas (implementadas no banco, não renderizadas aqui)

- **AVALIACAO**: `UNIQUE (id_usuario_fk, id_jogo_fk)` — garante uma única avaliação por par usuário/jogo.
- **JOGO_GENERO**: `PRIMARY KEY (id_jogo_fk, id_genero_fk)` — chave primária composta (tabela de junção).
- **JOGO_PLATAFORMA**: `PRIMARY KEY (id_jogo_fk, id_plataforma_fk)` — chave primária composta (tabela de junção).

## Notação da Cardinalidade

No diagrama Mermaid ERD:
- `||` = exatamente um
- `}o` = zero ou muitos
- `--` = relacionamento simples
