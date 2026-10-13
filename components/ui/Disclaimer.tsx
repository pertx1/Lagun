import Link from "next/link";

/** Aviso visible: Lagun no es un producto médico. */
export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm text-muted ${className}`}>
      Lagun es una app de apoyo emocional. <strong>No es un producto médico</strong> ni sustituye la atención de
      profesionales de la salud. Si lo necesitas, tienes <Link href="/ayuda" className="font-bold text-accent underline">teléfonos de ayuda aquí</Link>.
    </p>
  );
}
