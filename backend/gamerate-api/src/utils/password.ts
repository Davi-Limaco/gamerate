import { argon2id, hash, verify, type HashOptions } from 'argon2';

/**
 * Hash e verificação de senha com Argon2 (variante argon2id).
 *
 * Argon2id é a variante recomendada pela OWASP para hashing de senhas: ela
 * combina resistência a ataques de side-channel (argon2i) com resistência a
 * ataques de GPU/ASIC via alto custo de memória (argon2d). O hash resultante
 * já inclui o algoritmo, a versão e os parâmetros (memória, iterações,
 * paralelismo) e um salt aleatório por senha — não é preciso gerenciar salt
 * manualmente nem armazená-lo em coluna separada.
 *
 * Exemplo de hash gerado: $argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>
 */

const ARGON2_OPTIONS: HashOptions = {
  type: argon2id,
  // Parâmetros recomendados pela OWASP (nível "mínimo" para argon2id):
  // ~19 MiB de memória, 2 iterações, 1 thread. Valores mais altos aumentam a
  // segurança às custas de tempo de resposta no login/cadastro.
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

/** Gera o hash Argon2id de uma senha em texto puro. */
export async function hashPassword(senha: string): Promise<string> {
  return hash(senha, ARGON2_OPTIONS);
}

/**
 * Compara uma senha em texto puro com um hash Argon2 previamente armazenado.
 * Retorna `false` tanto para senha incorreta quanto para hash malformado —
 * nunca lança para esses casos, apenas para erros inesperados da biblioteca.
 */
export async function verifyPassword(hashArmazenado: string, senha: string): Promise<boolean> {
  try {
    return await verify(hashArmazenado, senha);
  } catch {
    // verify() lança se `hashArmazenado` não estiver em um formato Argon2
    // válido (ex.: dado legado em texto puro). Tratamos como "não confere".
    return false;
  }
}
