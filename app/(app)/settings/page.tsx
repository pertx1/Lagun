import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";
import { deleteAccount } from "@/app/actions";
import { SUPPORTED_COUNTRIES } from "@/config/safety";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const { profile } = await requireProfile();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-black">Ajustes</h1>

      <SettingsForm
        profile={profile}
        countries={SUPPORTED_COUNTRIES}
        vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""}
      />

      <Card>
        <CardTitle>Revisar cómo estás</CardTitle>
        <p className="my-2 text-sm text-muted">
          Repite el cuestionario cuando quieras para ajustar tu inicio. Tus estadísticas anteriores se conservan.
        </p>
        <Link href="/onboarding" className={buttonClass("secondary")}>
          Repetir cuestionario
        </Link>
      </Card>

      <Card>
        <CardTitle>Tus datos</CardTitle>
        <p className="my-2 text-sm text-muted">
          Son tuyos. Puedes descargarlos o borrarlos para siempre. Lee la{" "}
          <Link href="/privacidad" className="font-bold text-accent underline">política de privacidad</Link>.
        </p>
        <a href="/api/account/export" className={buttonClass("secondary")} download>
          Descargar mis datos (JSON)
        </a>
        <details className="mt-4 rounded-2xl border-2 border-danger p-3">
          <summary className="cursor-pointer font-bold text-danger">Borrar mi cuenta</summary>
          <form action={deleteAccount} className="mt-3 flex flex-col gap-2">
            <p className="text-sm">
              Se borrarán para siempre tu cuenta, tu jarra, tus check-ins, Igel y todo lo demás. No se puede deshacer.
            </p>
            <label htmlFor="confirm" className="text-sm font-bold">
              Escribe BORRAR para confirmar
            </label>
            <input id="confirm" name="confirm" required pattern="[Bb][Oo][Rr][Rr][Aa][Rr]" className={inputClass} autoComplete="off" />
            <Button variant="danger" type="submit">
              Borrar mi cuenta para siempre
            </Button>
          </form>
        </details>
      </Card>

      <form action={logout}>
        <Button variant="secondary" type="submit" className="w-full">
          Cerrar sesión
        </Button>
      </form>

      <p className="text-center text-sm">
        <Link href="/familias" className="font-bold text-accent underline">Para familias</Link> ·{" "}
        <Link href="/privacidad" className="font-bold text-accent underline">Privacidad</Link> ·{" "}
        <Link href="/ayuda" className="font-bold text-accent underline">Ayuda</Link>
      </p>
      <Disclaimer className="text-center" />
    </div>
  );
}
