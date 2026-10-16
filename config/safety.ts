import type { L10n, Locale } from "@/lib/i18n/config";

/**
 * Recursos de ayuda por país. Editable y ampliable: añade una entrada al
 * objeto RESOURCES con el código ISO 3166-1 alfa-2 del país.
 * Nombres y descripciones van en los 5 idiomas de la app.
 *
 * ⚠️ Antes de publicar, revisa que teléfonos y enlaces sigan vigentes
 * (deberían revisarse periódicamente: los servicios cambian).
 */

export interface HelpResource {
  name: L10n;
  description: L10n;
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
  name: L10n;
  emergency: HelpResource;
  /** Lo primero que se muestra en una crisis. */
  crisis: HelpResource[];
  /** Otros apoyos útiles. */
  support: HelpResource[];
  /** Organizaciones fiables para el apartado de identidad. */
  identity: HelpResource[];
}

export const RESOURCES: Record<string, CountryResources> = {
  ES: {
    code: "ES",
    name: { es: "España", ca: "Espanya", eu: "Espainia", gl: "España", en: "Spain" },
    emergency: {
      name: { es: "112 · Emergencias", ca: "112 · Emergències", eu: "112 · Larrialdiak", gl: "112 · Emerxencias", en: "112 · Emergencies" },
      description: {
        es: "Si tu vida o la de otra persona corre peligro ahora mismo.",
        ca: "Si la teva vida o la d'una altra persona està en perill ara mateix.",
        eu: "Zure bizitza edo beste norbaitena arriskuan badago oraintxe bertan.",
        gl: "Se a túa vida ou a doutra persoa corre perigo agora mesmo.",
        en: "If your life or someone else's is in danger right now.",
      },
      phone: "112",
      always: true,
    },
    crisis: [
      {
        name: {
          es: "024 · Línea de atención a la conducta suicida",
          ca: "024 · Línia d'atenció a la conducta suïcida",
          eu: "024 · Suizidio-jokabidearen arretarako linea",
          gl: "024 · Liña de atención á conduta suicida",
          en: "024 · Suicide prevention line",
        },
        description: {
          es: "Gratuita, confidencial y 24 horas. Te atiende una persona preparada para escucharte.",
          ca: "Gratuïta, confidencial i 24 hores. T'atén una persona preparada per escoltar-te.",
          eu: "Doakoa, isilpekoa eta 24 orduz. Zu entzuteko prestatutako pertsona batek artatuko zaitu.",
          gl: "Gratuíta, confidencial e 24 horas. Atenderate unha persoa preparada para escoitarte.",
          en: "Free, confidential and 24/7. A trained person will listen to you.",
        },
        phone: "024",
        url: "https://www.sanidad.gob.es/linea024/",
        always: true,
      },
      {
        name: {
          es: "Fundación ANAR · Niños/as y adolescentes",
          ca: "Fundació ANAR · Infants i adolescents",
          eu: "ANAR Fundazioa · Haurrak eta nerabeak",
          gl: "Fundación ANAR · Nenos/as e adolescentes",
          en: "ANAR Foundation · Children and teenagers",
        },
        description: {
          es: "Teléfono y chat para menores de edad. Gratuito y confidencial.",
          ca: "Telèfon i xat per a menors d'edat. Gratuït i confidencial.",
          eu: "Adingabeentzako telefonoa eta txata. Doakoa eta isilpekoa.",
          gl: "Teléfono e chat para menores de idade. Gratuíto e confidencial.",
          en: "Phone and chat for under-18s. Free and confidential.",
        },
        phone: "900202010",
        url: "https://www.anar.org/",
        always: true,
        youth: true,
      },
      {
        name: {
          es: "Teléfono de la Esperanza",
          ca: "Telèfon de l'Esperança",
          eu: "Itxaropenaren Telefonoa",
          gl: "Teléfono da Esperanza",
          en: "Teléfono de la Esperanza (helpline)",
        },
        description: {
          es: "Escucha y apoyo emocional en momentos difíciles.",
          ca: "Escolta i suport emocional en moments difícils.",
          eu: "Entzute eta laguntza emozionala une zailetan.",
          gl: "Escoita e apoio emocional en momentos difíciles.",
          en: "Listening and emotional support in hard moments.",
        },
        phone: "717003717",
        url: "https://telefonodelaesperanza.org/",
        always: true,
      },
    ],
    support: [
      {
        name: {
          es: "016 · Violencia de género",
          ca: "016 · Violència de gènere",
          eu: "016 · Genero-indarkeria",
          gl: "016 · Violencia de xénero",
          en: "016 · Gender-based violence",
        },
        description: {
          es: "Información y apoyo. La llamada no aparece en la factura.",
          ca: "Informació i suport. La trucada no apareix a la factura.",
          eu: "Informazioa eta laguntza. Deia ez da fakturan agertzen.",
          gl: "Información e apoio. A chamada non aparece na factura.",
          en: "Information and support. The call doesn't show on the phone bill.",
        },
        phone: "016",
        always: true,
      },
      {
        name: {
          es: "Confederación Salud Mental España",
          ca: "Confederació Salut Mental Espanya",
          eu: "Confederación Salud Mental España",
          gl: "Confederación Saúde Mental España",
          en: "Confederación Salud Mental España",
        },
        description: {
          es: "Información sobre salud mental y asociaciones cerca de ti.",
          ca: "Informació sobre salut mental i associacions a prop teu.",
          eu: "Osasun mentalari buruzko informazioa eta zure inguruko elkarteak.",
          gl: "Información sobre saúde mental e asociacións preto de ti.",
          en: "Mental health information and associations near you.",
        },
        url: "https://consaludmental.org/",
      },
    ],
    identity: [
      {
        name: {
          es: "028 · Atención a personas LGTBI",
          ca: "028 · Atenció a persones LGTBI",
          eu: "028 · LGTBI pertsonentzako arreta",
          gl: "028 · Atención a persoas LGTBI",
          en: "028 · LGBTI support line",
        },
        description: {
          es: "Línea pública de apoyo y orientación ante la discriminación LGTBIfóbica.",
          ca: "Línia pública de suport i orientació davant la discriminació LGTBIfòbica.",
          eu: "Diskriminazio LGTBIfobikoaren aurrean laguntza eta orientazioa ematen duen linea publikoa.",
          gl: "Liña pública de apoio e orientación ante a discriminación LGTBIfóbica.",
          en: "Public line for support and guidance against anti-LGBTI discrimination.",
        },
        phone: "028",
        always: true,
      },
      {
        name: { es: "FELGTBI+", ca: "FELGTBI+", eu: "FELGTBI+", gl: "FELGTBI+", en: "FELGTBI+" },
        description: {
          es: "Federación estatal con recursos y grupos de jóvenes LGTBIQ+.",
          ca: "Federació estatal amb recursos i grups de joves LGTBIQ+.",
          eu: "Estatu mailako federazioa, LGTBIQ+ gazteentzako baliabide eta taldeekin.",
          gl: "Federación estatal con recursos e grupos de mozos LGTBIQ+.",
          en: "National federation with resources and LGBTIQ+ youth groups.",
        },
        url: "https://felgtbi.org/",
      },
      {
        name: { es: "Chrysallis", ca: "Chrysallis", eu: "Chrysallis", gl: "Chrysallis", en: "Chrysallis" },
        description: {
          es: "Asociación de familias de infancia y juventud trans.",
          ca: "Associació de famílies d'infància i joventut trans.",
          eu: "Haur eta gazte trans-en familien elkartea.",
          gl: "Asociación de familias da infancia e mocidade trans.",
          en: "Association of families of trans children and youth.",
        },
        url: "https://chrysallis.org.es/",
      },
    ],
  },
  INTL: {
    code: "INTL",
    name: { es: "Otro país", ca: "Un altre país", eu: "Beste herrialde bat", gl: "Outro país", en: "Another country" },
    emergency: {
      name: {
        es: "Número de emergencias local",
        ca: "Número d'emergències local",
        eu: "Tokiko larrialdi-zenbakia",
        gl: "Número de emerxencias local",
        en: "Local emergency number",
      },
      description: {
        es: "Llama al número de emergencias de tu país (112 en la UE, 911 en gran parte de América).",
        ca: "Truca al número d'emergències del teu país (112 a la UE, 911 a gran part d'Amèrica).",
        eu: "Deitu zure herrialdeko larrialdi-zenbakira (112 EBn, 911 Ameriketako zati handi batean).",
        gl: "Chama ao número de emerxencias do teu país (112 na UE, 911 en gran parte de América).",
        en: "Call your country's emergency number (112 in the EU, 911 in much of the Americas).",
      },
      phone: "112",
      always: true,
    },
    crisis: [
      {
        name: { es: "Find A Helpline", ca: "Find A Helpline", eu: "Find A Helpline", gl: "Find A Helpline", en: "Find A Helpline" },
        description: {
          es: "Directorio internacional de líneas de ayuda gratuitas por país.",
          ca: "Directori internacional de línies d'ajuda gratuïtes per país.",
          eu: "Doako laguntza-lerroen nazioarteko direktorioa, herrialdeka.",
          gl: "Directorio internacional de liñas de axuda gratuítas por país.",
          en: "International directory of free helplines by country.",
        },
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

export function supportedCountries(locale: Locale) {
  return Object.values(RESOURCES).map((r) => ({ code: r.code, name: r.name[locale] }));
}
