import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  const emailDetailsLog = `
========================================
[EMAIL LOG RECORD]
To: ${options.to}
Subject: ${options.subject}
Message: ${options.text}
${options.html ? `HTML: ${options.html}` : ""}
========================================`;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.log("⚠️ SMTP credentials not fully configured in env. Logging email to console:");
    console.log(emailDetailsLog);
    return true; 
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: parseInt(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`✉️ Email successfully sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error("❌ SMTP Delivery Failed. Log verification fallback:");
    console.error(error);
    console.log(emailDetailsLog);
    return true;
  }
}
