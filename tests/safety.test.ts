import { describe, expect, it } from "vitest";
import { detectCrisis, normalize } from "@/lib/safety";

describe("detectCrisis", () => {
  it.each([
    "Me quiero morir",
    "a veces pienso en quitarme la vida",
    "no vale la pena seguir",
    "ojalá no despertar mañana",
    "me he cortado otra vez",
    "pienso en hacerme daño",
    "Ya no quiero vivir",
    "estoy pensando en suicidarme",
    "mi tío abusa de mí",
    "MATARME",
    "i want to die",
  ])("detecta: %s", (t) => {
    expect(detectCrisis(t).crisis).toBe(true);
  });

  it.each([
    "el examen de mates me mata",
    "me muero de risa jajaja",
    "estoy cansada de estudiar",
    "mi madre no me entiende",
    "",
  ])("no salta con: %s", (t) => {
    expect(detectCrisis(t).crisis).toBe(false);
  });

  it("normaliza tildes y mayúsculas", () => {
    expect(normalize("¡Ojalá NO despertar!")).toBe("ojala no despertar");
  });
});
