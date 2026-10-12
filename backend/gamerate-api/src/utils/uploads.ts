import fs from 'node:fs';
import path from 'node:path';

/**
 * Configuração central de uploads (única fonte de verdade para o Multer, para
 * o servidor de arquivos estáticos e para a limpeza de arquivos em disco).
 *
 * Tudo que é ajustável vem de variáveis de ambiente, com padrões seguros:
 *   UPLOAD_DIR        pasta raiz dos uploads (padrão: ./uploads)
 *   UPLOAD_MAX_BYTES  tamanho máximo por arquivo (padrão: 2 MB)
 */

/** Pasta raiz dos uploads no disco (servida em `/uploads`). */
export const UPLOAD_ROOT = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

/** Subpasta onde ficam as fotos de perfil. */
export const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');

/** Prefixo público (URL) das fotos de perfil, ex.: /uploads/avatars/<uuid>.png */
export const AVATAR_PUBLIC_PREFIX = '/uploads/avatars';

/** Limite de tamanho por arquivo, em bytes. */
export const MAX_UPLOAD_BYTES = Number(process.env.UPLOAD_MAX_BYTES) || 2 * 1024 * 1024;

/**
 * Lista permitida (allowlist) de tipos MIME -> extensão gravada em disco.
 * A extensão do arquivo salvo vem DESTA tabela, nunca do nome enviado pelo
 * cliente — assim `foto.php.png`, `../../x.js` etc. não influenciam o nome.
 */
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
};

/** Garante que a estrutura de pastas exista (a aplicação sobe do zero). */
export function ensureUploadDirs(): void {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

/** Converte o nome do arquivo salvo no caminho público devolvido pela API. */
export function toPublicAvatarPath(filename: string): string {
  return `${AVATAR_PUBLIC_PREFIX}/${filename}`;
}

/**
 * Resolve o caminho público (ex.: /uploads/avatars/x.png) para o caminho
 * absoluto em disco, recusando qualquer coisa que escape da pasta de avatares
 * (defesa contra path traversal caso um valor estranho chegue ao banco).
 */
function resolveAvatarFile(publicPath: string): string | null {
  if (!publicPath.startsWith(`${AVATAR_PUBLIC_PREFIX}/`)) return null;
  const filename = path.basename(publicPath);
  const absolute = path.join(AVATAR_DIR, filename);
  return path.dirname(absolute) === AVATAR_DIR ? absolute : null;
}

/** Remove um arquivo de upload do disco (caminho absoluto). Nunca lança erro. */
export async function removeFileQuietly(absolutePath: string): Promise<void> {
  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Falha ao remover arquivo de upload:', error);
    }
  }
}

/** Remove do disco a foto referenciada por um caminho público do banco. */
export async function removeAvatarByPublicPath(publicPath: string): Promise<void> {
  const absolute = resolveAvatarFile(publicPath);
  if (absolute) await removeFileQuietly(absolute);
}

/**
 * Confere a "assinatura" (magic bytes) do arquivo gravado. O `mimetype` do
 * multipart é informado pelo cliente e pode ser forjado; os primeiros bytes
 * do conteúdo não. Retorna true se o conteúdo realmente é JPEG, PNG ou GIF.
 */
export async function hasImageSignature(absolutePath: string): Promise<boolean> {
  const handle = await fs.promises.open(absolutePath, 'r');
  try {
    const buffer = Buffer.alloc(8);
    await handle.read(buffer, 0, 8, 0);
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isGif = buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a';
    return isJpeg || isPng || isGif;
  } finally {
    await handle.close();
  }
}
