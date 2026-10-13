import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Para familias" };

export default function FamiliasPage() {
  return (
    <LegalPage title="Información para madres, padres y tutores">
      <p>
        Lagun es una app de bienestar emocional para jóvenes de 13 a 25 años. Ofrece herramientas sencillas para
        gestionar el estrés de los estudios, las relaciones, la convivencia en casa o dudas sobre la propia identidad.
      </p>
      <h2>Qué es (y qué no es)</h2>
      <ul>
        <li>Es un espacio de apoyo y autocuidado: registro de emociones, ejercicios de respiración, consejos y una conversación con una IA que escucha.</li>
        <li><strong>No es un servicio médico ni psicológico</strong> y no sustituye la atención profesional.</li>
        <li>No usa rachas, castigos ni mecánicas que generen dependencia o presión por usarla a diario.</li>
      </ul>
      <h2>Seguridad</h2>
      <ul>
        <li>Si la app detecta señales de riesgo (en el cuestionario o en el chat), muestra de inmediato teléfonos de ayuda como el 024, la Fundación ANAR o el 112.</li>
        <li>El botón de ayuda está siempre visible en todas las pantallas.</li>
        <li>Los contenidos sobre identidad son emocionales, adecuados a la edad y nunca explícitos.</li>
      </ul>
      <h2>Privacidad de su hijo/a</h2>
      <ul>
        <li>Solo se pide un nombre de usuario y una contraseña: ni email, ni nombre real, ni fecha de nacimiento.</li>
        <li>El chat no se guarda en ningún sitio.</li>
        <li>Sus datos emocionales solo son visibles para su propia cuenta.</li>
        <li>Puede descargarlos o borrarlos en cualquier momento.</li>
      </ul>
      <h2>Consentimiento (menores de 14 años)</h2>
      <p>
        En España, para tratar los datos de menores de 14 años hace falta el consentimiento de quien ejerce la patria
        potestad o tutela. En el registro, la persona confirma con una casilla que tiene 14 años o más, o que cuenta
        con ese permiso.
      </p>
      <h2>Cómo acompañar</h2>
      <p>
        Lo más valioso suele ser escuchar sin juzgar. Si le preocupa cómo está su hijo/a, puede llamar también a la
        Fundación ANAR (línea para familias) o consultar con su centro de salud. Tiene todos los recursos en{" "}
        <Link href="/ayuda" className="font-bold text-accent underline">Ayuda</Link>.
      </p>
    </LegalPage>
  );
}
