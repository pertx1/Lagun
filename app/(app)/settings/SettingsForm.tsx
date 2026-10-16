"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { removePushSubscriptions, savePushSubscription, updateSettings, type SettingsInput } from "@/app/actions";
import { setLocale } from "@/app/i18n-actions";
import type { Profile, Theme } from "@/lib/types";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Field";
import { applyTheme } from "@/components/ui/ThemeSync";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function Toggle({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-bold">
          {label}
        </label>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors ${
          checked ? "border-primary bg-primary" : "border-line bg-surface-2"
        }`}
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
  const { t, locale } = useI18n();
  const s = t.settings;
  const router = useRouter();
  const [p, setP] = useState(profile);
  const [saved, setSaved] = useState<string | null>(null);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [, start] = useTransition();

  function save(patch: SettingsInput) {
    setP((prev) => ({ ...prev, ...patch }) as Profile);
    start(async () => {
      const res = await updateSettings(patch);
      setSaved(res.ok ? s.saved : s.saveFailed);
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
      setPushMsg(s.notifOff);
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidKey) {
      setPushMsg(s.notifUnsupported);
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setPushMsg(s.notifDenied);
      return;
    }
    try {
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) });
      const res = await savePushSubscription(JSON.parse(JSON.stringify(sub)));
      if (res.ok) {
        setP((prev) => ({ ...prev, notifications_enabled: true }));
        setPushMsg(s.notifOn);
      } else setPushMsg(s.notifFailed);
    } catch {
      setPushMsg(s.notifDeviceFailed);
    }
  }

  return (
    <>
      <p role="status" className="sr-only">
        {saved}
      </p>

      <Card>
        <CardTitle>{s.about}</CardTitle>
        <label htmlFor="name" className="mt-3 block font-bold">
          {s.nameLabel}
        </label>
        <input
          id="name"
          defaultValue={p.display_name}
          maxLength={40}
          className={`${inputClass} mt-1`}
          onBlur={(e) => e.target.value.trim() && e.target.value !== p.display_name && save({ display_name: e.target.value })}
        />
        <label htmlFor="language" className="mt-4 block font-bold">
          {s.language}
        </label>
        <select
          id="language"
          value={locale}
          onChange={(e) =>
            start(async () => {
              await setLocale(e.target.value);
              router.refresh();
            })
          }
          className={`${inputClass} mt-1`}
        >
          {LOCALES.map((l) => (
            <option key={l} value={l} lang={l}>
              {LOCALE_NAMES[l]}
            </option>
          ))}
        </select>
        <label htmlFor="country" className="mt-4 block font-bold">
          {s.country}
        </label>
        <select id="country" value={p.country} onChange={(e) => save({ country: e.target.value })} className={`${inputClass} mt-1`}>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <CardTitle>{s.appearance}</CardTitle>
        <fieldset className="mt-3">
          <legend className="sr-only">{s.theme}</legend>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["light", s.light],
                ["dark", s.dark],
                ["system", s.auto],
              ] as [Theme, string][]
            ).map(([th, label]) => (
              <button
                key={th}
                type="button"
                aria-pressed={p.theme === th}
                onClick={() => {
                  applyTheme(th);
                  save({ theme: th });
                }}
                className={`rounded-2xl border-2 p-3 font-bold ${p.theme === th ? "border-primary bg-surface-2" : "border-line bg-bg"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card>
        <CardTitle>{s.eodTitle}</CardTitle>
        <div className="mt-3 flex flex-col gap-4">
          <Toggle
            id="eod"
            checked={p.end_of_day_checkin}
            onChange={(v) => save({ end_of_day_checkin: v })}
            label={s.eodToggle}
            hint={s.eodHint}
          />
          {p.end_of_day_checkin && (
            <>
              <div>
                <label htmlFor="hour" className="font-bold">
                  {s.hour}
                </label>
                <select
                  id="hour"
                  value={p.checkin_hour}
                  onChange={(e) => save({ checkin_hour: Number(e.target.value) })}
                  className={`${inputClass} mt-1`}
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
              <fieldset>
                <legend className="font-bold">{s.days}</legend>
                <div className="mt-2 flex gap-1.5">
                  {s.dayShort.map((d, i) => {
                    const on = p.checkin_days.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={on}
                        aria-label={s.dayNames[i]}
                        onClick={() => save({ checkin_days: on ? p.checkin_days.filter((x) => x !== i) : [...p.checkin_days, i] })}
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
        <CardTitle>{s.notifTitle}</CardTitle>
        <div className="mt-3 flex flex-col gap-2">
          <Toggle id="push" checked={p.notifications_enabled} onChange={togglePush} label={s.notifToggle} hint={s.notifHint} />
          {p.notifications_enabled && !p.end_of_day_checkin && <p className="text-sm text-muted">{s.notifNeedEod}</p>}
          {pushMsg && (
            <p role="status" className="text-sm">
              {pushMsg}
            </p>
          )}
        </div>
      </Card>
    </>
  );
}
