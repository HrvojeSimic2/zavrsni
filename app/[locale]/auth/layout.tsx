import { PageShell } from "@/components/layout/page-shell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageShell
      variant="contained"
      contentClassName="flex min-h-[60vh] items-center justify-center"
    >
      {children}
    </PageShell>
  );
}
