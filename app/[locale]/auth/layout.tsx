import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
