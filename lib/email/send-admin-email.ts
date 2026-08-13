type SendAdminEmailInput = {
  subject: string;
  html: string;
  text: string;
};

type SendAdminEmailResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

function parseAdminEmails(value: string | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function sendAdminEmail(
  input: SendAdminEmailInput
): Promise<SendAdminEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const admins = parseAdminEmails(process.env.ADMIN_EMAILS);

  if (!apiKey || !from || admins.length === 0) {
    return {
      ok: true,
      skipped: true,
      reason:
        "Email not configured. Set RESEND_API_KEY, RESEND_FROM, and ADMIN_EMAILS.",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: admins,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Resend API error (${res.status}): ${body || res.statusText}`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown email error.",
    };
  }
}

