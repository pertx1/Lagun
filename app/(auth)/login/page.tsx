import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-center text-3xl font-black">¡Hola de nuevo!</h1>
      <p className="mb-6 text-center text-muted">Qué bien verte por aquí.</p>
      <LoginForm />
      <p className="mt-6 text-center">
        ¿Primera vez?{" "}
        <Link href="/register" className="font-bold text-accent underline">
          Crea tu cuenta
        </Link>
      </p>
    </>
  );
}
