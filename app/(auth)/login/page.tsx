import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { LoginForm } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.login };
}

export default async function LoginPage() {
  const { t } = await getI18n();
  return (
    <>
      <h1 className="text-center text-3xl font-black">{t.auth.loginTitle}</h1>
      <p className="mb-6 text-center text-muted">{t.auth.loginSubtitle}</p>
      <LoginForm />
      <p className="mt-6 text-center">
        {t.auth.firstTime}{" "}
        <Link href="/register" className="font-bold text-accent underline">
          {t.auth.createLink}
        </Link>
      </p>
    </>
  );
}
