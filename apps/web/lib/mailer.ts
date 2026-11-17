import { APP_NAME } from "@phonebook/shared";

export type Mail = { to: string; subject: string; text: string };

/** Swap the provider by writing another class with this shape. */
export interface Mailer {
  send(mail: Mail): Promise<boolean>;
}

class BrevoMailer implements Mailer {
  async send(m: Mail): Promise<boolean> {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: { name: process.env.EMAIL_FROM_NAME || APP_NAME, email: process.env.EMAIL_FROM_ADDRESS },
          to: [{ email: m.to }],
          subject: m.subject,
          textContent: m.text,
        }),
        signal: AbortSignal.timeout(8000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

// Used when no email key is set. Prints to the server console in development only.
class ConsoleMailer implements Mailer {
  async send(m: Mail): Promise<boolean> {
    if (process.env.NODE_ENV !== "production") console.log(`\n[email to ${m.to}] ${m.subject}\n${m.text}\n`);
    return false;
  }
}

export function getMailer(): Mailer {
  return process.env.BREVO_API_KEY && process.env.EMAIL_FROM_ADDRESS ? new BrevoMailer() : new ConsoleMailer();
}

/** Never throws. A failed email must not break login. */
export async function sendMail(m: Mail): Promise<boolean> {
  try {
    return await getMailer().send(m);
  } catch {
    return false;
  }
}

/** Later: SMS can be added here. Not used yet because SMS costs money. */
export interface SmsSender {
  send(to: string, text: string): Promise<boolean>;
}
