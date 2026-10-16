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

describe("detectCrisis en otros idiomas", () => {
  it.each([
    ["ca", "Em vull morir, no puc més"],
    ["ca", "a vegades penso en fer-me mal"],
    ["ca", "no val la pena viure"],
    ["gl", "Quero morrer"],
    ["gl", "non quero vivir así"],
    ["gl", "fágome dano cando estou mal"],
    ["eu", "Hil nahi dut"],
    ["eu", "ez dut bizi nahi"],
    ["eu", "bere buruaz beste egiteko gogoa"],
    ["en", "I don't want to live anymore"],
    ["en", "sometimes I hurt myself"],
    ["en", "I'm not safe at home"],
  ])("detecta (%s): %s", (_, t) => {
    expect(detectCrisis(t).crisis).toBe(true);
  });

  it.each([
    "Avui estic cansat dels exàmens",
    "Hoxe estou un pouco triste",
    "Gaur oso nekatuta nago",
    "This exam is killing me lol",
  ])("no salta con: %s", (t) => {
    expect(detectCrisis(t).crisis).toBe(false);
  });
});
