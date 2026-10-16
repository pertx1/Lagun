import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { partsInTz, safeTz } from "@/lib/dates";
import { getI18n } from "@/lib/i18n/server";
import { DATE_LOCALE } from "@/lib/i18n/config";
import { JarClient, type JarEntry } from "./JarClient";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.jar };
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function JarraPage({ searchParams }: PageProps<"/jarra">) {
  const { supabase, profile } = await requireProfile();
  const { t, locale } = await getI18n();
  const tz = safeTz(profile.timezone);
  const currentYm = partsInTz(new Date(), tz).ymd.slice(0, 7);
  const sp = await searchParams;
  const ym = typeof sp.mes === "string" && /^\d{4}-\d{2}$/.test(sp.mes) && sp.mes <= currentYm ? sp.mes : currentYm;

  // Margen de un día a cada lado y filtrado fino por zona horaria.
  const from = new Date(`${ym}-01T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 1);
  const to = new Date(`${shiftMonth(ym, 1)}-01T00:00:00Z`);
  to.setUTCDate(to.getUTCDate() + 1);

  const { data } = await supabase
    .from("emotions")
    .select("id, emotion, color, created_at")
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString())
    .order("created_at", { ascending: true })
    .limit(500);

  const entries = (data ?? []).filter((e) => partsInTz(new Date(e.created_at), tz).ymd.startsWith(ym)) as (JarEntry & {
    created_at: string;
  })[];

  const monthLabel = new Date(`${ym}-15T12:00:00Z`).toLocaleDateString(DATE_LOCALE[locale], { month: "long", year: "numeric" });
  const isCurrent = ym === currentYm;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-black">{t.jar.title}</h1>
        <p className="text-muted">{t.jar.subtitle}</p>
      </div>
      <nav aria-label={t.jar.monthNav} className="flex items-center justify-between rounded-2xl bg-surface px-2 py-1">
        <Link href={`/jarra?mes=${shiftMonth(ym, -1)}`} className="rounded-xl p-2 font-bold text-accent" aria-label={t.jar.prev}>
          ←
        </Link>
        <p className="font-extrabold capitalize" aria-live="polite">{monthLabel}</p>
        {isCurrent ? (
          <span className="w-9" />
        ) : (
          <Link href={`/jarra?mes=${shiftMonth(ym, 1)}`} className="rounded-xl p-2 font-bold text-accent" aria-label={t.jar.next}>
            →
          </Link>
        )}
      </nav>
      <JarClient key={ym} initial={entries} isCurrentMonth={isCurrent} monthLabel={monthLabel} />
    </div>
  );
}
