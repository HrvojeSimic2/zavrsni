import { redirect } from "next/navigation";

export default async function NewTourPage({
  params,
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);
  redirect(`/${locale}/guide/tours?new=1`);
}

