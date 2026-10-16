import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { AREAS, type Area, type FeedPost } from "@/lib/types";
import { AREA_INFO } from "@/config/areas";
import { FeedCard } from "./FeedCard";

export const metadata: Metadata = { title: "Feed" };

type Filter = "para-ti" | "todo" | "favoritos" | Area;

export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  const { supabase, profile } = await requireProfile();
  const sp = await searchParams;
  const raw = typeof sp.ver === "string" ? sp.ver : "para-ti";
  const filter: Filter = (["para-ti", "todo", "favoritos", ...AREAS] as string[]).includes(raw) ? (raw as Filter) : "para-ti";

  const { data: favs } = await supabase.from("favorites").select("post_id");
  const favSet = new Set((favs ?? []).map((f) => f.post_id as number));

  let q = supabase.from("feed_posts").select("*").order("created_at", { ascending: false }).order("id", { ascending: false }).limit(100);
  if (filter === "para-ti") {
    const areas = profile.active_areas.length ? profile.active_areas : AREAS;
    q = q.in("area", [...areas, "general"]);
  } else if (filter === "favoritos") {
    q = q.in("id", favSet.size ? [...favSet] : [-1]);
  } else if (filter !== "todo") {
    q = q.eq("area", filter);
  }
  const { data: posts } = await q;

  const tabs: { key: Filter; label: string }[] = [
    { key: "para-ti", label: "Para ti" },
    { key: "favoritos", label: "♥ Guardados" },
    { key: "todo", label: "Todo" },
    ...AREAS.map((a) => ({ key: a as Filter, label: `${AREA_INFO[a].emoji} ${AREA_INFO[a].short}` })),
  ];

  return (
    <div className="flex flex-col gap-4">
      {AREAS.includes(filter as Area) && (
        <Link href={`/area/${filter}`} className="self-start font-bold text-accent">
          ‹ {AREA_INFO[filter as Area].label}
        </Link>
      )}
      <div>
        <h1 className="text-2xl font-black">Para leer con calma</h1>
        <p className="text-muted">Frases, historias reales y consejos. Guarda lo que te ayude.</p>
      </div>
      <nav aria-label="Filtrar" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/feed?ver=${t.key}`}
            aria-current={filter === t.key ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
              filter === t.key ? "bg-primary text-on-primary" : "bg-surface text-fg"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {(posts ?? []).length === 0 ? (
        <p className="rounded-3xl bg-surface p-6 text-center text-muted">
          {filter === "favoritos" ? "Aún no has guardado nada. Toca el ♡ de lo que te guste." : "No hay nada por aquí todavía."}
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
