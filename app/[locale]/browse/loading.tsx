import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <PageShell variant="full">
      <section className="bg-linear-to-br from-primary/10 via-background to-secondary/10 border-b">
        <div className="container py-12">
          <div className="max-w-3xl space-y-4">
            <div className="h-12 w-2/3 rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-full rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-5/6 rounded-lg bg-muted animate-pulse" />
          </div>

          <div className="mt-8 max-w-2xl">
            <div className="h-12 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </section>

      <section className="py-8 bg-muted/30">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-10 w-full rounded bg-muted animate-pulse" />
                  <div className="h-10 w-full rounded bg-muted animate-pulse" />
                  <div className="h-10 w-full rounded bg-muted animate-pulse" />
                  <div className="h-10 w-full rounded bg-muted animate-pulse" />
                </CardContent>
              </Card>
            </aside>

            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                <div className="h-10 w-44 rounded bg-muted animate-pulse" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 12 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden h-full">
                    <div className="h-56 bg-muted animate-pulse" />
                    <CardContent className="pt-5 space-y-3">
                      <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
                      <div className="h-4 w-full rounded bg-muted animate-pulse" />
                      <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                      <div className="h-9 w-28 rounded bg-muted animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

