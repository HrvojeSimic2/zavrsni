import { PageShell } from "@/components/layout/page-shell";
import { BrowseClient } from "@/components/browse/browse-client";
import { getBrowseGuidesData } from "@/lib/actions/guide-actions";

export const dynamic = "force-dynamic";

type SearchParamValue = string | string[] | undefined;
type BrowseSearchParams = {
  q?: SearchParamValue;
  interest?: SearchParamValue;
  where?: SearchParamValue;
  language?: SearchParamValue;
  available?: SearchParamValue;
  verified?: SearchParamValue;
  maxRate?: SearchParamValue;
  sort?: SearchParamValue;
  page?: SearchParamValue;
};

function getFirst(value: SearchParamValue): string | undefined {
  if (typeof value === "string") return value;
  return Array.isArray(value) ? value[0] : undefined;
}

type PageProps = {
  searchParams?: BrowseSearchParams | Promise<BrowseSearchParams>;
};

export default async function BrowsePage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const { guides, languages, filters, pagination } = await getBrowseGuidesData({
    q: getFirst(resolvedSearchParams?.q) ?? null,
    interest: getFirst(resolvedSearchParams?.interest) ?? null,
    where: getFirst(resolvedSearchParams?.where) ?? null,
    language: getFirst(resolvedSearchParams?.language) ?? null,
    available: getFirst(resolvedSearchParams?.available) ?? null,
    verified: getFirst(resolvedSearchParams?.verified) ?? null,
    maxRate: getFirst(resolvedSearchParams?.maxRate) ?? null,
    sort: getFirst(resolvedSearchParams?.sort) ?? null,
    page: getFirst(resolvedSearchParams?.page) ?? null,
  });

  return (
    <PageShell variant="full">
      <BrowseClient
        guides={guides}
        languages={languages}
        filters={filters}
        pagination={pagination}
      />
    </PageShell>
  );
}
