import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { AREA_INFO } from "@/config/areas";
import { AREA_TOOLS, isArea } from "@/config/areaTools";

export async function generateMetadata({ params }: PageProps<"/area/[area]">): Promise<Metadata> {
  const { area } = await params;
  return { title: isArea(area) ? AREA_INFO[area].label : "Lagun" };
}

export default async function AreaPage({ params }: PageProps<"/area/[area]">) {
  const { area } = await params;
  if (!isArea(area)) notFound();
  const { profile } = await requireProfile();
  const info = AREA_INFO[area];
  const forYou = profile.active_areas.includes(area);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black">
          <span aria-hidden>{info.emoji}</span> {info.label}
        </h1>
        <p className="text-muted">{info.blurb}</p>
        {forYou && <p className="mt-2 inline-block rounded-full bg-surface-2 px-3 py-1 text-xs font-bold">💚 Uno de tus temas</p>}
      </div>
      <ul className="grid grid-cols-2 gap-3">
        {AREA_TOOLS[area].map((t) => (
          <li key={t.slug}>
            <Link
              href={t.href ?? `/area/${area}/${t.slug}`}
              className="flex aspect-square flex-col justify-between rounded-3xl border border-line bg-surface p-4 transition-transform hover:bg-surface-2 active:scale-95"
            >
              <span aria-hidden className="text-4xl">
                {t.emoji}
              </span>
              <span>
                <span className="block font-extrabold leading-tight">{t.title}</span>
                <span className="block text-sm leading-snug text-muted">{t.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
