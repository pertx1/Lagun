import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Frog } from "@/components/Frog/Frog";
import { ButtonLink } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";

export default async function Landing() {
  const { userId } = await getSession();
  if (userId) redirect("/home");

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-5 pb-10 pt-20 text-center">
      <Frog size={180} mood="happy" withCorner state={{ corner: "corner_lily" }} label="Igel, la rana, te saluda" />
      <h1 className="mt-4 text-4xl font-black tracking-tight text-accent">Lagun</h1>
      <p className="mt-4 text-lg">
        Tu rincón para cuando los estudios, la gente, la casa o lo que sientes se hace bola.
        <strong> Entra cuando quieras, sin rachas ni presión.</strong>
      </p>
      <ul className="mt-6 grid w-full grid-cols-2 gap-3 text-left text-sm">
        {[
          ["🫙", "Jarra de emociones"],
          ["💬", "Alguien que te escucha"],
          ["🧘", "Respirar y calmarte"],
          ["🐸", "Igel, una rana que te acompaña"],
        ].map(([icon, text]) => (
          <li key={text} className="rounded-2xl bg-surface p-3 font-bold">
            <span aria-hidden>{icon}</span> {text}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex w-full flex-col gap-3">
        <ButtonLink href="/register">Empezar</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          Ya tengo cuenta
        </ButtonLink>
      </div>
      <p className="mt-6 text-sm">
        <Link href="/familias" className="font-bold text-accent underline">Información para familias</Link>
        {" · "}
        <Link href="/privacidad" className="font-bold text-accent underline">Privacidad</Link>
      </p>
      <Disclaimer className="mt-6" />
    </main>
  );
}
