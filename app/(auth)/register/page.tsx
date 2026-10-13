import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-center text-3xl font-black">Bienvenido/a a Lagun</h1>
      <p className="mb-6 text-center text-muted">
        Un sitio tranquilo para cuando lo necesites. Sin presión, sin rachas, a tu ritmo.
      </p>
      <RegisterForm />
      <p className="mt-6 text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-accent underline">
          Entra
        </Link>
      </p>
    </>
  );
}
