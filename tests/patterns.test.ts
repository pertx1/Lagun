import { describe, expect, it } from "vitest";
import { analyzeStudyPatterns, describePatternsForAI } from "@/lib/patterns";

const TZ = "Europe/Madrid";
const at = (d: string) => `${d}T12:00:00Z`;

describe("analyzeStudyPatterns", () => {
  const items = [
    { title: "Mates", due_date: "2026-09-10" },
    { title: "Historia", due_date: "2026-09-25" },
    { title: "Inglés", due_date: "2026-10-17" },
    { title: "Trabajo bio", due_date: "2026-10-19" },
    { title: "Física", due_date: "2026-10-21" },
  ];
  const moods = [
    // época de exámenes: ánimo bajo
    { mood: 1, created_at: at("2026-09-08") },
    { mood: 1, created_at: at("2026-09-10") },
    { mood: 0, created_at: at("2026-09-23") },
    // resto: ánimo bueno
    { mood: 3, created_at: at("2026-09-15") },
    { mood: 4, created_at: at("2026-09-18") },
    { mood: 3, created_at: at("2026-10-01") },
  ];
  const emotions = [
    { emotion: "ansiedad", created_at: at("2026-09-09") },
    { emotion: "ansiedad", created_at: at("2026-09-24") },
    { emotion: "cansancio", created_at: at("2026-09-24") },
    { emotion: "alegria", created_at: at("2026-09-16") },
    { emotion: "calma", created_at: at("2026-09-18") },
    { emotion: "alegria", created_at: at("2026-10-02") },
  ];
  const p = analyzeStudyPatterns({ items, moods, emotions, timeZone: TZ, now: new Date(at("2026-10-16")) });

  it("mide la carga de los próximos días", () => {
    expect(p.upcoming7).toBe(3);
    expect(p.load).toBe("cargada");
    expect(p.next).toEqual({ title: "Inglés", inDays: 1 });
  });

  it("detecta el bajón de ánimo antes de exámenes", () => {
    expect(p.examMood).toBeCloseTo(2 / 3);
    expect(p.otherMood).toBeCloseTo(10 / 3);
    expect(p.insights[0]).toContain("suele bajar");
  });

  it("detecta emociones que suben con los exámenes", () => {
    expect(p.examEmotions.map((e) => e.key)).toEqual(["ansiedad"]);
    expect(p.insights.join(" ")).toContain("ansiedad");
  });

  it("sin datos suficientes no saca conclusiones", () => {
    const empty = analyzeStudyPatterns({ items: [], moods: [], emotions: [], timeZone: TZ, now: new Date(at("2026-10-16")) });
    expect(empty.examMood).toBeNull();
    expect(empty.load).toBe("libre");
    expect(empty.insights).toEqual([]);
  });

  it("prepara el texto para la IA", () => {
    const t = describePatternsForAI(p);
    expect(t).toContain("3 exámenes/entregas en los próximos 7 días");
    expect(t).toContain("Nunca lo uses para presionar");
  });
});
