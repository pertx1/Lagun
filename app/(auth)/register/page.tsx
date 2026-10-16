import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { RegisterForm } from "./RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.register };
}

export default async function RegisterPage() {
  const { t } = await getI18n();
  return (
    <>
      <h1 className="text-center text-3xl font-black">{t.auth.registerTitle}</h1>
      <p className="mb-6 text-center text-muted">{t.auth.registerSubtitle}</p>
      <RegisterForm />
      <p className="mt-6 text-center">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-bold text-accent underline">
          {t.auth.loginLink}
        </Link>
      </p>
    </>
  );
}
