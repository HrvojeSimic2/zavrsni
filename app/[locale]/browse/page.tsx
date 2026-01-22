import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { BrowseClient } from "@/components/browse/browse-client";
import { getTours } from "@/lib/actions/tour-actions";

export default async function BrowsePage() {
  const tours = await getTours();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <BrowseClient tours={tours} />
      <Footer />
    </div>
  );
}
