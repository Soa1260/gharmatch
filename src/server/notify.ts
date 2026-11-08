export interface Notifier {
  send(to: string, subject: string, text: string): Promise<void>;
}

/** Sends plain email through Resend. Messages are kept generic on purpose: no names, no details of an incident. */
export class ResendNotifier implements Notifier {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(to: string, subject: string, text: string): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to, subject, text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Email failed with status ${res.status}`);
  }
}

/** Used when email is not configured. Records that a message was skipped, never its address or content. */
export class SkippedNotifier implements Notifier {
  async send(): Promise<void> {
    console.info(JSON.stringify({ level: "info", msg: "notification skipped, email not configured" }));
  }
}

export function getNotifier(): Notifier {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  return key && from ? new ResendNotifier(key, from) : new SkippedNotifier();
}

/** A notification must never break the action that caused it. */
export async function safeSend(n: Notifier, to: string, subject: string, text: string): Promise<boolean> {
  try {
    await n.send(to, subject, text);
    return true;
  } catch {
    console.error(JSON.stringify({ level: "error", msg: "notification failed" }));
    return false;
  }
}
