import Link from "next/link";
import { Frog } from "@/components/Frog/Frog";
import { Disclaimer } from "@/components/ui/Disclaimer";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-16">
      <Link href="/" className="mx-auto mb-2" aria-label="Volver al inicio">
        <Frog size={110} mood="happy" label="" />
      </Link>
      {children}
      <Disclaimer className="mt-8 text-center" />
    </main>
  );
}
