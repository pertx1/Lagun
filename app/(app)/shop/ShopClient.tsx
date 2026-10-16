"use client";

import { useState, useTransition } from "react";
import { buyItem, equipItem } from "@/app/actions";
import type { FrogCategory, FrogState, ShopItem } from "@/lib/types";
import { Frog } from "@/components/Frog/Frog";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/client";

const CATEGORIES: { key: FrogCategory; icon: string }[] = [
  { key: "color", icon: "🎨" },
  { key: "hat", icon: "🧢" },
  { key: "glasses", icon: "👓" },
  { key: "outfit", icon: "🧣" },
  { key: "accessory", icon: "🍵" },
  { key: "corner", icon: "🪷" },
];

export function ShopClient({
  items,
  owned: ownedInitial,
  points: pointsInitial,
  frogState,
}: {
  items: ShopItem[];
  owned: string[];
  points: number;
  frogState: FrogState;
}) {
  const { t, f } = useI18n();
  const sh = t.shop;
  const nameOf = (it: ShopItem) => sh.items[it.id] ?? it.name;
  const [cat, setCat] = useState<FrogCategory>("color");
  const [state, setState] = useState<FrogState>(frogState);
  const [preview, setPreview] = useState<ShopItem | null>(null);
  const [owned, setOwned] = useState(new Set(ownedInitial));
  const [points, setPoints] = useState(pointsInitial);
  const [msg, setMsg] = useState<string | null>(null);
  const [hop, setHop] = useState(0);
  const [pending, start] = useTransition();

  const shown: FrogState = preview ? { ...state, [preview.category]: preview.id } : state;
  const isOwned = (it: ShopItem) => it.cost === 0 || owned.has(it.id);

  function equip(it: ShopItem | null, category: FrogCategory) {
    start(async () => {
      const res = await equipItem(category, it?.id ?? null);
      if (res.ok) {
        setState((s) => {
          const n = { ...s };
          if (it) n[category] = it.id;
          else if (category === "color") n.color = "color_verde";
          else delete n[category];
          return n;
        });
        setPreview(null);
      }
    });
  }

  function buy(it: ShopItem) {
    setMsg(null);
    start(async () => {
      const res = await buyItem(it.id);
      if (!res.ok) {
        setMsg(res.error === "insufficient" ? sh.notEnough : res.error === "owned" ? sh.owned : sh.failed);
        return;
      }
      setOwned((o) => new Set(o).add(it.id));
      setPoints((p) => p - it.cost);
      setHop((h) => h + 1);
      setMsg(f(sh.bought, { name: nameOf(it) }));
      equip(it, it.category);
    });
  }

  const list = items.filter((i) => i.category === cat);
  const equippedId = state[cat];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center rounded-3xl bg-surface p-4">
        <Frog key={hop} state={shown} size={190} withCorner hop={hop > 0} label={sh.frogAria} />
        <p className="mt-2 text-lg font-black" aria-live="polite">
          {f(sh.leaves, { n: points })}
        </p>
        <p className="text-center text-sm text-muted">
          {sh.howToEarn}
        </p>
      </div>

      <div role="tablist" aria-label={sh.categoriesAria} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            role="tab"
            aria-selected={cat === c.key}
            onClick={() => {
              setCat(c.key);
              setPreview(null);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
              cat === c.key ? "bg-primary text-on-primary" : "bg-surface text-fg"
            }`}
          >
            <span aria-hidden>{c.icon}</span> {sh.categories[c.key]}
          </button>
        ))}
      </div>

      {msg && (
        <p role="status" className="rounded-2xl bg-surface-2 p-3 text-center font-bold">
          {msg}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3" role="tabpanel">
        {list.map((it) => {
          const mine = isOwned(it);
          const equipped = equippedId === it.id || (cat === "color" && !equippedId && it.id === "color_verde");
          return (
            <li key={it.id} className={`flex flex-col items-center gap-2 rounded-3xl border-2 p-3 ${equipped ? "border-primary bg-surface-2" : "border-line bg-surface"}`}>
              <button
                type="button"
                onClick={() => setPreview(preview?.id === it.id ? null : it)}
                className="rounded-2xl"
                aria-label={f(sh.tryAria, { name: nameOf(it) })}
              >
                <Frog state={{ ...state, [it.category]: it.id }} size={90} animate={false} withCorner={cat === "corner"} label="" />
              </button>
              <p className="text-center font-bold leading-tight">{nameOf(it)}</p>
              {equipped ? (
                cat !== "color" ? (
                  <Button variant="secondary" className="w-full text-sm" disabled={pending} onClick={() => equip(null, cat)}>
                    {sh.remove}
                  </Button>
                ) : (
                  <p className="text-sm font-bold text-accent">{sh.worn}</p>
                )
              ) : mine ? (
                <Button className="w-full text-sm" disabled={pending} onClick={() => equip(it, cat)}>
                  {sh.wear}
                </Button>
              ) : (
                <Button
                  variant={points >= it.cost ? "primary" : "secondary"}
                  className="w-full text-sm"
                  disabled={pending || points < it.cost}
                  onClick={() => buy(it)}
                  aria-label={f(sh.buyAria, { name: nameOf(it), cost: it.cost })}
                >
                  🍃 {it.cost}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
