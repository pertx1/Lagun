import { describe, expect, it } from "vitest";
import { describeUser, isChatTopic, TOPIC_GUIDES } from "@/lib/companion-knowledge";

describe("conocimiento de Igel", () => {
  it("valida el tema", () => {
    expect(isChatTopic("acad")).toBe(true);
    expect(isChatTopic("hack")).toBe(false);
  });

  it("cada tema tiene su guía especializada", () => {
    expect(TOPIC_GUIDES.acad).toContain("Pomodoro");
    expect(TOPIC_GUIDES.fam).toContain("crisis: true");
    expect(TOPIC_GUIDES.iden).toContain("nada sexual");
  });

  it("resume a la persona sin datos vacíos", () => {
    expect(describeUser({})).toBe("");
    const s = describeUser({
      moodAvg7d: 1.2,
      topEmotions7d: ["ansiedad"],
      upcomingExams: [{ title: "Mates", inDays: 1 }],
      activeAreas: ["acad"],
    });
    expect(s).toContain("bajo");
    expect(s).toContain("Mates (mañana)");
    expect(s).toContain("Estudios");
  });
});
