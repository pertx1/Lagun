"use client";

import { useOptimistic, useState, useTransition } from "react";
import { awardActivity, toggleFavorite } from "@/app/actions";
import type { FeedPost } from "@/lib/types";
import { AREA_EMOJI } from "@/config/areas";
import { useI18n } from "@/lib/i18n/client";
import { PointsToast } from "@/components/modules/PointsToast";

const TYPE_ICON = { frase: "💭", historia: "📖", consejo: "💡" } as const;

export function FeedCard({ post, favorite }: { post: FeedPost; favorite: boolean }) {
  const [fav, setFav] = useOptimistic(favorite);
  const [, start] = useTransition();
  const [points, setPoints] = useState<number | null>(null);
  const { t, f } = useI18n();
  const area = post.area === "general" ? null : post.area;

  return (
    <article
      className={`rounded-3xl border p-5 ${post.type === "frase" ? "border-transparent bg-surface-2" : "border-line bg-surface"}`}
      aria-labelledby={`post-${post.id}`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-muted">
        <span>
          <span aria-hidden>{TYPE_ICON[post.type]}</span> {t.feed.types[post.type]}
        </span>
        {area && (
          <span>
            · <span aria-hidden>{AREA_EMOJI[area]}</span> {t.areas[area].short}
          </span>
        )}
        <button
          type="button"
          aria-pressed={fav}
          aria-label={f(fav ? t.feed.unsaveAria : t.feed.saveAria, { title: post.title })}
          onClick={() =>
            start(async () => {
              setFav(!fav);
              await toggleFavorite(post.id, !fav);
            })
          }
          className={`ml-auto rounded-full p-2 text-xl ${fav ? "text-danger" : "text-muted"}`}
        >
          <span aria-hidden>{fav ? "♥" : "♡"}</span>
        </button>
      </div>
      <h2 id={`post-${post.id}`} className={`font-black ${post.type === "frase" ? "text-2xl" : "text-lg"}`}>
        {post.title}
      </h2>
      <p className={`mt-1 ${post.type === "frase" ? "text-lg" : ""}`}>{post.body}</p>
      {post.type === "historia" && (
        <div className="mt-3">
          {points === null ? (
            <button
              type="button"
              onClick={() => awardActivity("story").then(setPoints)}
              className="text-sm font-bold text-accent underline"
            >
              {t.feed.read}
            </button>
          ) : (
            <PointsToast points={points} text={t.feed.readDone} />
          )}
        </div>
      )}
    </article>
  );
}
