import { describe, expect, it } from "vitest";
import { scoreAssessment, isReassessmentDue, isSafetyConcern } from "@/lib/scoring";
import { QUESTIONS } from "@/lib/questionnaire";

function answers(fill: Partial<Record<string, number>> = {}, base = 0) {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, fill[q.id] ?? base]));
}

describe("scoreAssessment", () => {
  it("normaliza cada área a 0..1 según su nº de ítems", () => {
    const r = scoreAssessment(answers({ I1: 4, I2: 4, I3: 4, A1: 4, A2: 4, A3: 4, A4: 4 }));
    expect(r.scores.areas.iden).toBe(1); // 12 / (3*4)
    expect(r.scores.areas.acad).toBe(1); // 16 / (4*4)
    expect(r.scores.areas.soc).toBe(0);
  });

  it("elige como principal el área con mayor pct (identidad con 3 ítems es comparable)", () => {
    const r = scoreAssessment(answers({ I1: 3, I2: 3, I3: 3, A1: 3, A2: 2, A3: 2, A4: 2 }));
    // iden = 9/12 = 0.75; acad = 9/16 = 0.5625
    expect(r.primaryArea).toBe("iden");
  });

  it("marca como activas las áreas a ≤15 puntos del máximo", () => {
    // acad = 0.75, soc = 0.625, fam = 0.5
    const r = scoreAssessment(answers({ A1: 3, A2: 3, A3: 3, A4: 3, S1: 3, S2: 3, S3: 2, S4: 2, F1: 2, F2: 2, F3: 2, F4: 2 }));
    expect(r.primaryArea).toBe("acad");
    expect(r.activeAreas).toEqual(["acad", "soc"]);
  });

  it("sin malestar en ningún área → sin principal ni activas", () => {
    const r = scoreAssessment(answers());
    expect(r.primaryArea).toBeNull();
    expect(r.activeAreas).toEqual([]);
  });

  it("G1/G2 no puntúan para área y G2 se guarda invertido", () => {
    const r = scoreAssessment(answers({ G1: 4, G2: 1 }));
    expect(r.primaryArea).toBeNull();
    expect(r.scores.wellbeing).toEqual({ mood: 4, support: 1, support_need: 3 });
  });

  it("C1 no puntúa para área pero activa el cribado con 3-4", () => {
    expect(scoreAssessment(answers({ C1: 4 })).primaryArea).toBeNull();
    expect(scoreAssessment(answers({ C1: 2 })).safetyFlag).toBe(false);
    expect(scoreAssessment(answers({ C1: 3 })).safetyFlag).toBe(true);
    expect(isSafetyConcern(4)).toBe(true);
  });
});

describe("isReassessmentDue", () => {
  it("pide revisión pasados 30 días", () => {
    const now = new Date("2026-10-13T10:00:00Z");
    expect(isReassessmentDue("2026-09-20T10:00:00Z", now)).toBe(false);
    expect(isReassessmentDue("2026-09-13T10:00:00Z", now)).toBe(true);
    expect(isReassessmentDue(null, now)).toBe(true);
  });
});
