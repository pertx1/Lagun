import Link from "next/link";
import { Frog } from "@/components/Frog/Frog";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { getI18n } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const { t } = await getI18n();
  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-16">
      <Link href="/" className="mx-auto mb-2" aria-label={t.auth.backHome}>
        <Frog size={110} mood="happy" label="" />
      </Link>
      {children}
      <LanguageSwitcher className="mt-8" />
      <Disclaimer className="mt-6 text-center" />
    </main>
  );
}
