import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { AREAS, type Area, type FeedPost } from "@/lib/types";
import { AREA_EMOJI } from "@/config/areas";
import { FeedCard } from "./FeedCard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.feed };
}

type Filter = "para-ti" | "todo" | "favoritos" | Area;

export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  const { supabase, profile } = await requireProfile();
  const { t, locale } = await getI18n();
  const sp = await searchParams;
  const raw = typeof sp.ver === "string" ? sp.ver : "para-ti";
  const filter: Filter = (["para-ti", "todo", "favoritos", ...AREAS] as string[]).includes(raw) ? (raw as Filter) : "para-ti";

  const { data: favs } = await supabase.from("favorites").select("post_id");
  const favSet = new Set((favs ?? []).map((f) => f.post_id as number));

  const buildQuery = (lang: string | null) => {
    let q = supabase.from("feed_posts").select("*").order("created_at", { ascending: false }).order("id", { ascending: false }).limit(100);
    if (filter === "para-ti") {
      const areas = profile.active_areas.length ? profile.active_areas : AREAS;
      q = q.in("area", [...areas, "general"]);
    } else if (filter === "favoritos") {
      q = q.in("id", favSet.size ? [...favSet] : [-1]);
    } else if (filter !== "todo") {
      q = q.eq("area", filter);
    }
    // Los guardados se muestran tal cual; el resto, en tu idioma.
    if (lang && filter !== "favoritos") q = q.eq("lang", lang);
    return q;
  };
  const first = await buildQuery(locale);
  // Si aún no se ha aplicado la migración de idiomas, se muestra todo.
  const posts = first.error ? (await buildQuery(null)).data : first.data;

  const tabs: { key: Filter; label: string }[] = [
    { key: "para-ti", label: t.feed.forYou },
    { key: "favoritos", label: t.feed.saved },
    { key: "todo", label: t.feed.all },
    ...AREAS.map((a) => ({ key: a as Filter, label: `${AREA_EMOJI[a]} ${t.areas[a].short}` })),
  ];

  return (
    <div className="flex flex-col gap-4">
      {AREAS.includes(filter as Area) && (
        <Link href={`/area/${filter}`} className="self-start font-bold text-accent">
          ‹ {t.areas[filter as Area].label}
        </Link>
      )}
      <div>
        <h1 className="text-2xl font-black">{t.feed.title}</h1>
        <p className="text-muted">{t.feed.subtitle}</p>
      </div>
      <nav aria-label={t.feed.filterAria} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/feed?ver=${tab.key}`}
            aria-current={filter === tab.key ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
              filter === tab.key ? "bg-primary text-on-primary" : "bg-surface text-fg"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {(posts ?? []).length === 0 ? (
        <p className="rounded-3xl bg-surface p-6 text-center text-muted">
          {filter === "favoritos" ? t.feed.emptySaved : t.feed.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {(posts as FeedPost[]).map((p) => (
            <li key={p.id}>
              <FeedCard post={p} favorite={favSet.has(p.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
