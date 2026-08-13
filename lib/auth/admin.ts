function parseAdminEmails(value: string | undefined) {
  if (!value) return new Set<string>();
  return new Set(
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = parseAdminEmails(process.env.ADMIN_EMAILS);
  if (admins.size === 0) return false;
  return admins.has(email.trim().toLowerCase());
}

