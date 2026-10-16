import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { LegalPage } from "@/components/ui/LegalPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.families };
}

export default async function FamiliasPage() {
  const { t } = await getI18n();
  const p = t.legal.families;
  return <LegalPage title={p.title} intro={p.intro} sections={p.sections} />;
}
