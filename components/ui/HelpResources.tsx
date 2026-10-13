import type { CountryResources, HelpResource } from "@/config/safety";

function ResourceItem({ r, strong = false }: { r: HelpResource; strong?: boolean }) {
  return (
    <li className={`rounded-2xl border-2 p-4 ${strong ? "border-primary bg-surface" : "border-line bg-bg"}`}>
      <p className="font-extrabold">{r.name}</p>
      <p className="text-sm text-muted">
        {r.description}
        {r.always && " · 24 h"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {r.phone && (
          <a
            href={`tel:${r.phone}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-4 py-2 font-bold text-on-primary"
          >
            <span aria-hidden>📞</span> Llamar al {formatPhone(r.phone)}
          </a>
        )}
        {r.url && (
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border-2 border-line px-4 py-2 font-bold text-accent"
          >
            Abrir web <span className="sr-only">(se abre en otra pestaña)</span>
          </a>
        )}
      </div>
    </li>
  );
}

function formatPhone(p: string) {
  if (p.length === 9) return `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`;
  return p;
}

export function HelpResources({ resources, showIdentity = false }: { resources: CountryResources; showIdentity?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border-2 border-danger bg-danger-soft p-4">
        <p className="font-extrabold text-danger">Si estás en peligro ahora mismo</p>
        <p className="mb-3 text-sm">{resources.emergency.description}</p>
        <a
          href={`tel:${resources.emergency.phone}`}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-danger px-5 py-2 text-lg font-black text-bg"
        >
          <span aria-hidden>🚨</span> Llamar al {resources.emergency.phone}
        </a>
      </div>

      <section aria-labelledby="crisis-h">
        <h2 id="crisis-h" className="mb-2 text-lg font-extrabold">
          Hablar con alguien ahora
        </h2>
        <ul className="flex flex-col gap-3">
          {resources.crisis.map((r) => (
            <ResourceItem key={r.name} r={r} strong />
          ))}
        </ul>
      </section>

      {resources.support.length > 0 && (
        <section aria-labelledby="support-h">
          <h2 id="support-h" className="mb-2 text-lg font-extrabold">
            Otros apoyos
          </h2>
          <ul className="flex flex-col gap-3">
            {resources.support.map((r) => (
              <ResourceItem key={r.name} r={r} />
            ))}
          </ul>
        </section>
      )}

      {showIdentity && resources.identity.length > 0 && (
        <section aria-labelledby="iden-h">
          <h2 id="iden-h" className="mb-2 text-lg font-extrabold">
            Identidad y diversidad
          </h2>
          <ul className="flex flex-col gap-3">
            {resources.identity.map((r) => (
              <ResourceItem key={r.name} r={r} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
