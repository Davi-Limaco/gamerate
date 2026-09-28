import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Serviço isolado de envio de e-mail.
 *
 * `nodemailer` só é importado aqui (e não em routes/controllers), para que o
 * resto da aplicação não precise saber *como* um e-mail é enviado — apenas
 * chama `enviarEmailBoasVindas(...)`.
 *
 * Configuração via variáveis de ambiente (.env / .env.example):
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Se SMTP_HOST/SMTP_USER/SMTP_PASS não estiverem definidos (ex.: ambiente de
 * desenvolvimento sem uma conta SMTP própria), o serviço cria automaticamente
 * uma conta de teste na Ethereal (https://ethereal.email) na primeira vez que
 * for usado, e loga no terminal a URL de prévia de cada mensagem enviada —
 * nenhum e-mail real é entregue nesse modo.
 */

let transporterPromise: Promise<Transporter> | null = null;

function getEnv() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || '"GameRate" <no-reply@gamerate.dev>',
  };
}

async function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const { host, port, secure, user, pass } = getEnv();

      if (host && user && pass) {
        return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
      }

      // Sem credenciais SMTP configuradas -> conta de teste Ethereal
      // (apenas para desenvolvimento local).
      console.warn(
        '[SendMail] SMTP_HOST/SMTP_USER/SMTP_PASS não definidos no .env — ' +
        'usando uma conta de teste Ethereal (nenhum e-mail real será enviado).',
      );

      const testAccount = await nodemailer.createTestAccount();

      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    })();
  }

  return transporterPromise;
}

async function enviarEmailBoasVindas(destinatario: string, nomeUsuario: string): Promise<void> {
  const transporter = await getTransporter();

  const text =
    `Olá, ${nomeUsuario}!\n\n` +
    `Seu cadastro no GameRate foi concluído com sucesso.\n` +
    `Agora você já pode avaliar jogos e acompanhar o catálogo.\n\n` +
    `— Equipe GameRate`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#e2264d;">GAME<span style="color:#111;">RATE</span></h2>
      <p>Olá, <strong>${nomeUsuario}</strong>!</p>
      <p>Seu cadastro no GameRate foi concluído com sucesso.</p>
      <p>Agora você já pode avaliar jogos e acompanhar o catálogo.</p>
      <p style="color:#888; font-size:12px; margin-top:24px;">— Equipe GameRate</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: getEnv().from,
    to: destinatario,
    subject: 'Bem-vindo(a) ao GameRate!',
    text,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log(`[SendMail] Prévia da mensagem: ${previewUrl}`);
}

export default { enviarEmailBoasVindas };
