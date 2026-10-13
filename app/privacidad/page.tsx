import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";

export const metadata: Metadata = { title: "Privacidad" };

export default function PrivacidadPage() {
  return (
    <LegalPage title="Tu privacidad en Lagun">
      <p>
        Sabemos que lo que sientes es algo muy personal. Por eso guardamos lo mínimo, lo protegemos y nunca lo vendemos
        ni lo usamos para publicidad.
      </p>
      <h2>Qué datos guardamos</h2>
      <ul>
        <li>Tu nombre de usuario y tu contraseña (cifrada). No pedimos email, nombre real ni fecha de nacimiento.</li>
        <li>Tus respuestas al cuestionario, las emociones de tu jarra, tus check-ins de ánimo, tus exámenes y tus actividades de autocuidado.</li>
        <li>Tus preferencias (tema, notificaciones, hora del check-in) y la personalización de tu rana.</li>
      </ul>
      <h2>Qué NO guardamos</h2>
      <ul>
        <li>
          <strong>El chat no se guarda.</strong> Las conversaciones existen solo mientras la pantalla está abierta. Al
          salir, se borran. Para responderte, el mensaje se envía a un proveedor de IA que no lo usa para entrenar ni lo
          conserva más allá de lo que exige el servicio.
        </li>
        <li>Lo que escribes en el espacio para desahogarte no sale de tu dispositivo.</li>
        <li>No usamos rastreadores publicitarios.</li>
      </ul>
      <h2>Datos especialmente protegidos</h2>
      <p>
        Los datos sobre tu estado emocional se consideran datos sensibles (art. 9 RGPD). Solo tú puedes verlos: cada
        tabla está protegida para que ninguna otra cuenta pueda acceder a ellos.
      </p>
      <h2>Menores de edad</h2>
      <p>
        Lagun es para personas de 13 a 25 años. Si tienes menos de 14, hace falta el permiso de tu madre, padre o
        tutor/a (art. 7 LOPDGDD); lo confirmas al registrarte.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Puedes descargar todos tus datos o borrar tu cuenta para siempre desde <strong>Ajustes</strong>, en cualquier
        momento. También puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y
        portabilidad escribiendo al responsable del tratamiento, y reclamar ante la Agencia Española de Protección de
        Datos (aepd.es).
      </p>
      <h2>Responsable</h2>
      <p>[Nombre de la entidad responsable, NIF, dirección y email de contacto / DPD].</p>
    </LegalPage>
  );
}
