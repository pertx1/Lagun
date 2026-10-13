/**
 * Recursos de ayuda por país. Editable y ampliable: añade una entrada al
 * objeto RESOURCES con el código ISO 3166-1 alfa-2 del país.
 *
 * ⚠️ Antes de publicar, revisa que teléfonos y enlaces sigan vigentes
 * (deberían revisarse periódicamente: los servicios cambian).
 */

export interface HelpResource {
  name: string;
  description: string;
  /** Número tal y como se marca (se usa en tel:). */
  phone?: string;
  url?: string;
  /** Disponible 24h. */
  always?: boolean;
  /** Pensado especialmente para menores / jóvenes. */
  youth?: boolean;
}

export interface CountryResources {
  code: string;
  name: string;
  emergency: HelpResource;
  /** Lo primero que se muestra en una crisis. */
  crisis: HelpResource[];
  /** Otros apoyos útiles (jóvenes, identidad, familia…). */
  support: HelpResource[];
  /** Organizaciones fiables para el módulo de identidad. */
  identity: HelpResource[];
}

export const RESOURCES: Record<string, CountryResources> = {
  ES: {
    code: "ES",
    name: "España",
    emergency: {
      name: "112 · Emergencias",
      description: "Si tu vida o la de otra persona corre peligro ahora mismo.",
      phone: "112",
      always: true,
    },
    crisis: [
      {
        name: "024 · Línea de atención a la conducta suicida",
        description: "Gratuita, confidencial y 24 horas. Te atiende una persona preparada para escucharte.",
        phone: "024",
        url: "https://www.sanidad.gob.es/linea024/",
        always: true,
      },
      {
        name: "Fundación ANAR · Niños/as y adolescentes",
        description: "Teléfono y chat para menores de edad. Gratuito y confidencial.",
        phone: "900202010",
        url: "https://www.anar.org/",
        always: true,
        youth: true,
      },
      {
        name: "Teléfono de la Esperanza",
        description: "Escucha y apoyo emocional en momentos difíciles.",
        phone: "717003717",
        url: "https://telefonodelaesperanza.org/",
        always: true,
      },
    ],
    support: [
      {
        name: "016 · Violencia de género",
        description: "Información y apoyo. La llamada no aparece en la factura.",
        phone: "016",
        always: true,
      },
      {
        name: "Confederación Salud Mental España",
        description: "Información sobre salud mental y asociaciones cerca de ti.",
        url: "https://consaludmental.org/",
      },
    ],
    identity: [
      {
        name: "028 · Atención a personas LGTBI",
        description: "Línea pública de apoyo y orientación ante la discriminación LGTBIfóbica.",
        phone: "028",
        always: true,
      },
      {
        name: "FELGTBI+",
        description: "Federación estatal con recursos y grupos de jóvenes LGTBIQ+.",
        url: "https://felgtbi.org/",
      },
      {
        name: "Chrysallis",
        description: "Asociación de familias de infancia y juventud trans.",
        url: "https://chrysallis.org.es/",
      },
    ],
  },
  INTL: {
    code: "INTL",
    name: "Otro país",
    emergency: {
      name: "Número de emergencias local",
      description: "Llama al número de emergencias de tu país (112 en la UE, 911 en gran parte de América).",
      phone: "112",
      always: true,
    },
    crisis: [
      {
        name: "Find A Helpline",
        description: "Directorio internacional de líneas de ayuda gratuitas por país.",
        url: "https://findahelpline.com/",
      },
    ],
    support: [],
    identity: [],
  },
};

export const DEFAULT_COUNTRY = "ES";

export function getResources(country?: string | null): CountryResources {
  const code = (country ?? DEFAULT_COUNTRY).toUpperCase();
  return RESOURCES[code] ?? RESOURCES.INTL;
}

export const SUPPORTED_COUNTRIES = Object.values(RESOURCES).map((r) => ({ code: r.code, name: r.name }));
