import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { requireProfile } from "@/lib/auth";
import type { ShopItem } from "@/lib/types";
import { ShopClient } from "./ShopClient";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.shop };
}

export default async function ShopPage() {
  const { supabase, profile } = await requireProfile();
  const [{ data: items }, { data: inv }] = await Promise.all([
    supabase.from("shop_items").select("*").order("cost"),
    supabase.from("user_inventory").select("item_id"),
  ]);
  return (
    <ShopClient
      items={(items ?? []) as ShopItem[]}
      owned={(inv ?? []).map((i) => i.item_id as string)}
      points={profile.points}
      frogState={profile.frog_state}
    />
  );
}
