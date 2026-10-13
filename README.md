# 🐸 Lagun

**Lagun** (“amigo/a” en euskera) es una PWA de bienestar emocional para personas de **13 a 25 años**:
estrés académico, social, familiar e identidad. Se usa **cuando hace falta**, sin rachas, sin culpa y sin presión.

> Lagun es una app de apoyo. **No es un producto médico** ni sustituye la atención profesional.

---

## Qué incluye

| Área | Qué hay |
|---|---|
| Onboarding | Cuestionario cálido de 18 ítems (escala 0-4, barra de progreso), detección de área principal + áreas activas, **cribado de seguridad C1** con pantalla de apoyo inmediata |
| Home adaptativa | Módulos por área: **acad** (calendario de exámenes, Pomodoro, métodos de estudio), **soc** (retos amables, situaciones de práctica, habilidades, espacio para desahogarse), **fam** (constructor de “mensajes yo”, límites, conflictos, recursos), **iden** (afirmaciones, autoaceptación, organizaciones fiables). Check-in, respiración y grounding siempre disponibles |
| Chat IA efímero | Acompañante emocional vía `lib/ai.ts` (servidor). **No se guarda nada**. Doble detección de crisis: flag `crisis` estructurado del modelo + palabras clave en servidor y cliente |
| Ayuda urgente | Botón **siempre visible** en todas las pantallas (funciona sin JS) + página `/ayuda` + página offline con teléfonos |
| Rana + gamificación | Mascota SVG por capas (color, gorro, gafas, ropa, accesorio, rinconcito) con 6 estados de ánimo. Hojas 🍃 por **autocuidado**, nunca por constancia. Tienda con 27 objetos |
| Jarra de emociones | Bolas de colores que caen con animación; una jarra por mes con historial |
| Feed | Frases, historias y consejos, filtro por área, favoritos |
| Check-in de fin de día | Opcional; hora y días configurables. Aparece en la home y, si se activan, por push |
| Estadísticas | Ánimo (30 días), emociones, autocuidado, evolución por revisiones mensuales, “pequeñas mejoras”. Tono alentador |
| Re-evaluación mensual | Invitación amable a los 30 días; **nunca borra ni modifica el histórico** |
| Privacidad | RLS en todas las tablas, descarga de datos (JSON) y borrado de cuenta en cascada, info para familias, consentimiento parental para < 14 |
| PWA | Manifest, iconos (incl. maskable), service worker, offline, Web Push (VAPID) |
| Accesibilidad | Contraste AA en ambos temas, foco visible, navegación por teclado, `prefers-reduced-motion`, roles ARIA, “saltar al contenido” |

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS 4 · Supabase (Auth + Postgres + RLS) · Web Push · Vercel.
IA: Claude (Anthropic) detrás de una interfaz `CompanionProvider` intercambiable.

---

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta en orden:
   - `supabase/migrations/0001_schema.sql` (tablas, RLS, policies, triggers y funciones)
   - `supabase/seed.sql` (tienda y feed)

   O con la CLI: `supabase link` + `supabase db push` y luego el seed.
3. **Authentication → URL Configuration**: pon tu dominio en *Site URL* y añade `https://TU-DOMINIO/auth/confirm` en *Redirect URLs* (y `http://localhost:3000/auth/confirm` para desarrollo).
4. Recomendado: deja activada la confirmación de email.

### 2. Variables de entorno

```bash
cp .env.example .env.local
npx web-push generate-vapid-keys   # copia las claves a .env.local
```

| Variable | Dónde se usa |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente y servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor**: cron de notificaciones y borrado de cuenta |
| `ANTHROPIC_API_KEY`, `AI_PROVIDER`, `AI_MODEL` | **Solo servidor**: chat (`lib/ai.ts`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push |
| `CRON_SECRET` | Protege `/api/cron/checkin` |
| `NEXT_PUBLIC_SITE_URL` | Enlaces de confirmación de email |

### 3. Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # tests de puntuación y detección de crisis
npm run typecheck
npm run lint
```

El service worker solo se registra en producción (`npm run build && npm start`).

### 4. Despliegue en Vercel

1. Importa el repo en Vercel y añade las variables de entorno.
2. `vercel.json` programa `/api/cron/checkin` **cada hora** (cada persona elige su hora local).
   ⚠️ El plan Hobby de Vercel solo permite crons diarios: usa Pro, o un programador externo que llame a la ruta con `Authorization: Bearer $CRON_SECRET`.
3. Notificaciones en iPhone: solo funcionan con la app **instalada en la pantalla de inicio** (iOS 16.4+).

---

## Estructura

```
app/
  (auth)/login, (auth)/register     registro con edad mínima y consentimiento parental
  onboarding/                       cuestionario (también re-evaluación mensual)
  (app)/home | chat | jarra | feed | stats | shop | settings
  ayuda/ privacidad/ familias/      páginas públicas
  api/chat/route.ts                 llamada al LLM (servidor) + red de seguridad
  api/cron/checkin/route.ts         recordatorio push del check-in
  api/account/export/route.ts       descarga de datos (RGPD)
  actions.ts                        server actions (puntos, emociones, tienda, ajustes…)
components/Frog/                    mascota SVG por capas
components/Jar/                     jarra de emociones
components/modules/                 módulos por área y ejercicios
components/ui/                      sistema de diseño
config/safety.ts                    recursos de ayuda por país (editable)
config/emotions.ts, config/areas.ts
lib/ai.ts                           abstracción del LLM + system prompt
lib/scoring.ts, lib/questionnaire.ts
lib/safety.ts                       detección de crisis por palabras clave
lib/supabase/                       clientes (navegador, servidor, proxy)
proxy.ts                            refresco de sesión + rutas protegidas (antes "middleware")
public/sw.js, public/offline.html, app/manifest.ts
supabase/migrations, supabase/seed.sql
```

## Base de datos

Tablas del enunciado (`profiles`, `assessments`, `emotions`, `mood_checkins`, `activities`, `shop_items`,
`user_inventory`, `feed_posts`, `favorites`, `exams`) + `push_subscriptions`. **El chat no tiene tabla.**

Añadidos a `profiles`: `guardian_consent`, `consent_at`, `checkin_days` (frecuencia), `timezone`, `country`, `onboarded_at`.

Seguridad, además de RLS `auth.uid() = user_id` en todo:

- `points`, `primary_area`, `active_areas` y `frog_state` **no son editables desde el cliente** (privilegios por columna).
  Solo cambian mediante funciones `SECURITY DEFINER`:
  - `award_points(type)`: puntos fijos por tipo de autocuidado, con tope diario anti-“farmeo” (la actividad se registra aunque dé 0).
  - `buy_item(id)`, `equip_item(category, id)`: validan saldo y propiedad.
- `assessments`: sin `update`/`delete` → el histórico es intocable. Un trigger actualiza la home al insertar.
- `handle_new_user`: crea el perfil y **aplica la edad mínima en la base de datos** (< 13 rechazado; 13 sin consentimiento rechazado).
- `feed_posts` y `shop_items`: lectura pública.
- Borrar la cuenta elimina todo en cascada.

La migración se ha probado en PostgreSQL 16 con un stub del esquema `auth`: edad mínima, intentos de editar puntos/área,
insertar actividades o inventario, leer datos ajenos, tope diario, compra/equipamiento y borrado en cascada.

## Lógica de puntuación (`lib/scoring.ts`)

- `pct_area = suma / (nº ítems × 4)` → 0..1, comparable entre áreas (identidad tiene 3 ítems, el resto 4).
- Área principal = mayor `pct`. Empate → orden `acad, soc, fam, iden`. Si todo es 0 → sin área principal (la home muestra un poco de todo).
- Áreas activas = `pct ≥ max − 0.15` y `pct > 0`.
- G1/G2 se guardan como línea base (`wellbeing`), G2 también invertido (`support_need`). No puntúan para área.
- C1 ≥ 3 → pantalla de apoyo inmediata (no bloquea). No puntúa para área.
- La puntuación se calcula **en el servidor** a partir de las respuestas validadas.

## Chat y seguridad

- `lib/ai.ts` solo se puede importar en el servidor (`server-only`). La API key nunca llega al cliente.
- Respuesta estructurada `{ reply, crisis }` (JSON schema) + detección por palabras clave en servidor **y** cliente (el aviso aparece al instante, antes de que conteste la IA).
- Si la IA falla o declina responder en un momento de riesgo, se devuelve una respuesta segura de respaldo y se muestran los recursos.
- Se activa el *fallback* del lado del servidor de Anthropic (`fallbacks: "default"`) para que un rechazo por política se reintente con el modelo recomendado.
- No se registran ni se guardan mensajes; `Cache-Control: no-store`. El estado del chat vive en memoria y se limpia al salir de la pantalla, al cerrar/ocultar la página y al volver desde la bfcache.
- Límite de ritmo básico por usuario (en memoria por instancia; para producción a escala conviene uno distribuido).

---

## Decisiones que he tomado (revísalas)

1. **Edad y consentimiento**: mínimo 13 años. Entre 13 y 14 se pide una casilla de consentimiento de madre/padre/tutor (LOPDGDD art. 7). Una casilla **no es un consentimiento verificable**: antes de lanzar, define con asesoría legal un mecanismo real (p. ej. email al tutor/a con confirmación).
2. **“Dentro del 15 % del máximo”** se interpreta como 15 puntos porcentuales (`ACTIVE_MARGIN` en `lib/scoring.ts`).
3. **Re-evaluación mensual**: invitación no bloqueante en la home a los 30 días (se puede posponer), en lugar de obligar, para respetar el principio de “sin presión”.
4. **Moneda**: “hojas 🍃”. Tope diario por tipo de actividad para evitar abusos (sin rachas ni bonus por días seguidos).
5. **Proveedor de IA**: Claude (`claude-opus-5-5`, esfuerzo bajo para respuestas ágiles). Se puede cambiar con `AI_MODEL` o implementando otro `CompanionProvider`.
6. **Notificaciones**: solo el recordatorio del check-in que la persona active. Nada más.
7. **Desahogo y “mensajes yo”**: no se guardan.
8. **Paleta de emociones**: es identidad (bolas de la jarra) y siempre va acompañada de emoji + nombre; en las estadísticas las barras usan un solo tono y la etiqueta da la identidad.

## Pendiente antes de producción

- [ ] Revisión jurídica de `/privacidad` y `/familias` (rellenar responsable del tratamiento/DPD), EIPD (evaluación de impacto: datos de salud de menores).
- [ ] Verificar que teléfonos y enlaces de `config/safety.ts` siguen vigentes.
- [ ] Revisión de los textos por profesionales de salud mental juvenil y pruebas con jóvenes.
- [ ] Contrato de encargo de tratamiento con Supabase y el proveedor de IA; región de datos en la UE.
- [ ] Ampliar las palabras clave de crisis con ayuda profesional y monitorizar falsos negativos (sin guardar contenido).
