"use client";

import { useEffect, useState, useTransition } from "react";
import { removePushSubscriptions, savePushSubscription, updateSettings, type SettingsInput } from "@/app/actions";
import type { Profile, Theme } from "@/lib/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Field";
import { applyTheme } from "@/components/ui/ThemeSync";

const DAYS = ["D", "L", "M", "X", "J", "V", "S"];
const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function Toggle({ id, checked, onChange, label, hint }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-bold">{label}</label>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors ${checked ? "border-primary bg-primary" : "border-line bg-surface-2"}`}
      >
        <span className={`absolute top-0.5 size-6 rounded-full bg-bg shadow transition-all ${checked ? "left-6" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export function SettingsForm({
  profile,
  countries,
  vapidKey,
}: {
  profile: Profile;
  countries: { code: string; name: string }[];
  vapidKey: string;
}) {
  const [p, setP] = useState(profile);
  const [saved, setSaved] = useState<string | null>(null);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [, start] = useTransition();

  function save(patch: SettingsInput, msg = "Guardado ✓") {
    setP((prev) => ({ ...prev, ...patch }) as Profile);
    start(async () => {
      const res = await updateSettings(patch);
      setSaved(res.ok ? msg : "No se ha podido guardar");
    });
  }

  // Mantiene la zona horaria al día (para que el check-in llegue a tu hora).
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== profile.timezone) updateSettings({ timezone: tz });
  }, [profile.timezone]);

  async function togglePush(on: boolean) {
    setPushMsg(null);
    if (!on) {
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        await sub?.unsubscribe();
      } catch {}
      await removePushSubscriptions();
      setP((prev) => ({ ...prev, notifications_enabled: false }));
      setPushMsg("Notificaciones desactivadas.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidKey) {
      setPushMsg("Este navegador no permite notificaciones. En iPhone, primero instala Lagun en tu pantalla de inicio.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setPushMsg("Sin permiso no podemos avisarte. Puedes cambiarlo cuando quieras en los ajustes del navegador.");
      return;
    }
    try {
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) });
      const res = await savePushSubscription(JSON.parse(JSON.stringify(sub)));
      if (res.ok) {
        setP((prev) => ({ ...prev, notifications_enabled: true }));
        setPushMsg("¡Listo! Solo te escribiremos para lo que hayas activado.");
      } else setPushMsg("No se ha podido activar.");
    } catch {
      setPushMsg("No se ha podido activar en este dispositivo.");
    }
  }

  return (
    <>
      <p role="status" className="sr-only">{saved}</p>

      <Card>
        <CardTitle>Sobre ti</CardTitle>
        <label htmlFor="name" className="mt-3 block font-bold">Cómo te llamamos</label>
        <input
          id="name"
          defaultValue={p.display_name}
          maxLength={40}
          className={`${inputClass} mt-1`}
          onBlur={(e) => e.target.value.trim() && e.target.value !== p.display_name && save({ display_name: e.target.value })}
        />
        <label htmlFor="country" className="mt-4 block font-bold">País (para los teléfonos de ayuda)</label>
        <select id="country" value={p.country} onChange={(e) => save({ country: e.target.value })} className={`${inputClass} mt-1`}>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </Card>

      <Card>
        <CardTitle>Apariencia</CardTitle>
        <fieldset className="mt-3">
          <legend className="sr-only">Tema</legend>
          <div className="grid grid-cols-3 gap-2">
            {([
              ["light", "☀️ Claro"],
              ["dark", "🌙 Oscuro"],
              ["system", "📱 Auto"],
            ] as [Theme, string][]).map(([t, label]) => (
              <button
                key={t}
                type="button"
                aria-pressed={p.theme === t}
                onClick={() => {
                  applyTheme(t);
                  save({ theme: t });
                }}
                className={`rounded-2xl border-2 p-3 font-bold ${p.theme === t ? "border-primary bg-surface-2" : "border-line bg-bg"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card>
        <CardTitle>Check-in de fin de día</CardTitle>
        <div className="mt-3 flex flex-col gap-4">
          <Toggle
            id="eod"
            checked={p.end_of_day_checkin}
            onChange={(v) => save({ end_of_day_checkin: v })}
            label="Preguntarme qué tal ha ido el día"
            hint="Opcional. Si lo dejas apagado, no te molestaremos."
          />
          {p.end_of_day_checkin && (
            <>
              <div>
                <label htmlFor="hour" className="font-bold">¿A qué hora?</label>
                <select id="hour" value={p.checkin_hour} onChange={(e) => save({ checkin_hour: Number(e.target.value) })} className={`${inputClass} mt-1`}>
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <fieldset>
                <legend className="font-bold">¿Qué días?</legend>
                <div className="mt-2 flex gap-1.5">
                  {DAYS.map((d, i) => {
                    const on = p.checkin_days.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={on}
                        aria-label={DAY_NAMES[i]}
                        onClick={() =>
                          save({ checkin_days: on ? p.checkin_days.filter((x) => x !== i) : [...p.checkin_days, i] })
                        }
                        className={`size-10 rounded-full font-bold ${on ? "bg-primary text-on-primary" : "bg-surface-2"}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>Notificaciones</CardTitle>
        <div className="mt-3 flex flex-col gap-2">
          <Toggle
            id="push"
            checked={p.notifications_enabled}
            onChange={togglePush}
            label="Recibir avisos en este dispositivo"
            hint="Solo mensajes suaves para el check-in que hayas activado. Nada de presión."
          />
          {p.notifications_enabled && !p.end_of_day_checkin && (
            <p className="text-sm text-muted">Activa el check-in de fin de día para recibir su recordatorio.</p>
          )}
          {pushMsg && <p role="status" className="text-sm">{pushMsg}</p>}
        </div>
      </Card>
    </>
  );
}
