"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { EMOTION_BY_KEY, type EmotionKey } from "@/config/emotions";
import { RESOURCES } from "@/config/safety";
import type { ActivityType, FrogCategory, Theme } from "@/lib/types";

const ACTIVITY_TYPES: ActivityType[] = [
  "checkin", "emotion", "breathing", "grounding", "story", "pomodoro", "challenge", "journal", "module", "chat",
];

/** Registra una actividad de autocuidado. Devuelve los puntos ganados (0 si se llegó al tope diario). */
export async function awardActivity(type: ActivityType): Promise<number> {
  if (!ACTIVITY_TYPES.includes(type)) return 0;
  const { supabase } = await requireProfile();
  const { data } = await supabase.rpc("award_points", { p_type: type });
  revalidatePath("/", "layout");
  return typeof data === "number" ? data : 0;
}

export async function logEmotion(emotion: EmotionKey, intensity: number) {
  const def = EMOTION_BY_KEY[emotion];
  if (!def) return { ok: false as const, error: "Emoción no válida" };
  const level = Math.min(5, Math.max(1, Math.round(intensity || 3)));
  const { supabase, userId } = await requireProfile();
  const { data, error } = await supabase
    .from("emotions")
    .insert({ user_id: userId, emotion, color: def.color, intensity: level })
    .select("id, emotion, color, intensity, created_at")
    .single();
  if (error) return { ok: false as const, error: "No se ha podido guardar" };
  const { data: pts } = await supabase.rpc("award_points", { p_type: "emotion" });
  revalidatePath("/", "layout");
  return { ok: true as const, emotion: data, points: typeof pts === "number" ? pts : 0 };
}

export async function logMood(mood: number, note?: string) {
  const m = Math.round(mood);
  if (!(m >= 0 && m <= 4)) return { ok: false as const, points: 0 };
  const { supabase, userId } = await requireProfile();
  const cleanNote = note?.trim().slice(0, 500) || null;
  const { error } = await supabase.from("mood_checkins").insert({ user_id: userId, mood: m, note: cleanNote });
  if (error) return { ok: false as const, points: 0 };
  const { data: pts } = await supabase.rpc("award_points", { p_type: "checkin" });
  revalidatePath("/", "layout");
  return { ok: true as const, points: typeof pts === "number" ? pts : 0 };
}

export async function toggleFavorite(postId: number, favorite: boolean) {
  const { supabase, userId } = await requireProfile();
  if (favorite) {
    await supabase.from("favorites").upsert({ user_id: userId, post_id: postId });
  } else {
    await supabase.from("favorites").delete().eq("user_id", userId).eq("post_id", postId);
  }
  revalidatePath("/feed");
}

export async function addExam(form: FormData) {
  const subject = String(form.get("subject") ?? "").trim().slice(0, 60);
  const title = String(form.get("title") ?? "").trim().slice(0, 120);
  const due = String(form.get("due_date") ?? "");
  if (!subject || !title || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return;
  const { supabase, userId } = await requireProfile();
  await supabase.from("exams").insert({ user_id: userId, subject, title, due_date: due });
  revalidatePath("/home");
}

export async function deleteExam(id: number) {
  const { supabase, userId } = await requireProfile();
  await supabase.from("exams").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/home");
}

export async function buyItem(itemId: string) {
  const { supabase } = await requireProfile();
  const { error } = await supabase.rpc("buy_item", { p_item: itemId });
  revalidatePath("/", "layout");
  if (error) {
    const msg = error.message.includes("insuficientes")
      ? "Aún te faltan algunas hojas. ¡Sin prisa!"
      : error.message.includes("ya lo tienes")
        ? "¡Ya es tuyo!"
        : "No se ha podido comprar.";
    return { ok: false as const, error: msg };
  }
  return { ok: true as const };
}

export async function equipItem(category: FrogCategory, itemId: string | null) {
  const { supabase } = await requireProfile();
  const { error } = await supabase.rpc("equip_item", { p_category: category, p_item: itemId });
  revalidatePath("/", "layout");
  return { ok: !error };
}

export interface SettingsInput {
  display_name?: string;
  theme?: Theme;
  end_of_day_checkin?: boolean;
  checkin_hour?: number;
  checkin_days?: number[];
  notifications_enabled?: boolean;
  timezone?: string;
  country?: string;
}

export async function updateSettings(input: SettingsInput) {
  const patch: Record<string, unknown> = {};
  if (typeof input.display_name === "string" && input.display_name.trim())
    patch.display_name = input.display_name.trim().slice(0, 40);
  if (input.theme && ["light", "dark", "system"].includes(input.theme)) patch.theme = input.theme;
  if (typeof input.end_of_day_checkin === "boolean") patch.end_of_day_checkin = input.end_of_day_checkin;
  if (Number.isInteger(input.checkin_hour) && input.checkin_hour! >= 0 && input.checkin_hour! <= 23)
    patch.checkin_hour = input.checkin_hour;
  if (Array.isArray(input.checkin_days))
    patch.checkin_days = [...new Set(input.checkin_days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
  if (typeof input.notifications_enabled === "boolean") patch.notifications_enabled = input.notifications_enabled;
  if (typeof input.timezone === "string" && isValidTimeZone(input.timezone)) patch.timezone = input.timezone;
  if (typeof input.country === "string" && RESOURCES[input.country]) patch.country = input.country;
  if (Object.keys(patch).length === 0) return { ok: true };

  const { supabase, userId } = await requireProfile();
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  revalidatePath("/", "layout");
  return { ok: !error };
}

function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("es", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function savePushSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };
  const { supabase, userId } = await requireProfile();
  // Un endpoint pertenece a un único dispositivo: lo reasignamos si ya existía.
  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  });
  if (!error) await supabase.from("profiles").update({ notifications_enabled: true }).eq("id", userId);
  revalidatePath("/settings");
  return { ok: !error };
}

export async function removePushSubscriptions() {
  const { supabase, userId } = await requireProfile();
  await supabase.from("push_subscriptions").delete().eq("user_id", userId);
  await supabase.from("profiles").update({ notifications_enabled: false }).eq("id", userId);
  revalidatePath("/settings");
  return { ok: true };
}

/** Derecho de supresión (RGPD): borra la cuenta y, en cascada, todos sus datos. */
export async function deleteAccount(form: FormData) {
  if (String(form.get("confirm") ?? "").trim().toUpperCase() !== "BORRAR") return;
  const { supabase, userId } = await requireProfile({ allowNotOnboarded: true });
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error("No se ha podido borrar la cuenta");
  await supabase.auth.signOut();
  redirect("/?cuenta=borrada");
}
