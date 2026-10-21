// Gera test-files/midia-grande.mp4 (31 MB, acima do limite padrão de 30 MB das
// mídias) para o teste "mídia grande demais" do request.http. O arquivo não é
// versionado. Uso: node test-files/gerar-midia-grande.mjs
import { writeFileSync } from 'node:fs';

const cabecalho = Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32, 0, 0, 0, 0, 0x6d, 0x70, 0x34, 0x32, 0x69, 0x73, 0x6f, 0x6d]); // "ftyp"
writeFileSync(new URL('./midia-grande.mp4', import.meta.url), Buffer.concat([cabecalho, Buffer.alloc(31 * 1024 * 1024)]));
console.log('test-files/midia-grande.mp4 criado (31 MB)');
