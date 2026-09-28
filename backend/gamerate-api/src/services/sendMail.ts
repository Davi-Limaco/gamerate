import type { SendMailOptions, SentMessageInfo } from 'nodemailer';
import { transporter, mailConfig, mailEnabled } from '@/config/mail.ts';

export async function sendMail({
  to = mailConfig.to,
  subject,
  html,
  text,
}: {
  to?: string;
  subject: string;
  html?: string;
  text?: string;
}): Promise<SentMessageInfo | { response: string; envelope: { from: string; to: string[] }; ok: boolean; error?: unknown }> {
  if (!mailEnabled) {
    return {
      response: 'SMTP não configurado — e-mail não enviado.',
      envelope: {
        from: mailConfig.from,
        to: [to],
      },
      ok: false,
    };
  }

  const payload: SendMailOptions = {
    from: mailConfig.from,
    to,
    subject,
    text,
    html,
  };

  try {
    const result = await transporter.sendMail(payload);
    return { ...result, ok: true };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return {
      response: 'Falha ao enviar e-mail via SMTP.',
      envelope: {
        from: mailConfig.from,
        to: [to],
      },
      ok: false,
      error,
    };
  }
}

export async function sendWelcomeEmail({ nome, email }: { nome: string; email: string }) {
  const subject = 'Bem-vindo ao GameRate!';
  const text = `Olá ${nome},\n\nSeu cadastro foi realizado com sucesso no GameRate.\n\nAproveite para explorar jogos, avaliações e perfis da comunidade.\n\nAtenciosamente,\nEquipe GameRate`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color: #7c3aed;">Bem-vindo ao GameRate, ${nome}!</h2>
      <p>Seu cadastro foi realizado com sucesso.</p>
      <p>Agora você pode explorar jogos, escrever avaliações e interagir com a comunidade.</p>
      <p style="margin-top: 16px;">Atenciosamente,<br/>Equipe GameRate</p>
    </div>
  `;

  return sendMail({
    to: email,
    subject,
    text,
    html,
  });
}
