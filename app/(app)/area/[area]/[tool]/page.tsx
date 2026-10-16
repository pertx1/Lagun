import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireProfile } from "@/lib/auth";
import { partsInTz, safeTz } from "@/lib/dates";
import type { Exam } from "@/lib/types";
import { AREA_INFO } from "@/config/areas";
import { AREA_TOOLS, isArea } from "@/config/areaTools";
import { getResources } from "@/config/safety";
import { ExamCalendar, PomodoroTool, StudyMethods } from "@/components/modules/acad";
import { ChallengeTool, SituationsTool, SocialSkills, VentTool } from "@/components/modules/soc";
import { CommunicationTool, FamilyHelpNote, LimitsTool } from "@/components/modules/fam";
import { AffirmationsTool, IdentityOrgs, SelfAcceptance } from "@/components/modules/iden";

export async function generateMetadata({ params }: PageProps<"/area/[area]/[tool]">): Promise<Metadata> {
  const { area, tool } = await params;
  const t = isArea(area) ? AREA_TOOLS[area].find((x) => x.slug === tool) : undefined;
  return { title: t?.title ?? "Lagun" };
}

export default async function ToolPage({ params }: PageProps<"/area/[area]/[tool]">) {
  const { area, tool } = await params;
  if (!isArea(area)) notFound();
  const def = AREA_TOOLS[area].find((t) => t.slug === tool && !t.href);
  if (!def) notFound();
  const { supabase, profile } = await requireProfile();

  let content: ReactNode = null;
  switch (`${area}/${tool}`) {
    case "acad/calendario": {
      const today = partsInTz(new Date(), safeTz(profile.timezone)).ymd;
      const { data } = await supabase
        .from("exams")
        .select("id, subject, title, due_date")
        .gte("due_date", today)
        .order("due_date")
        .limit(50);
      content = <ExamCalendar exams={(data ?? []) as Exam[]} today={today} />;
      break;
    }
    case "acad/pomodoro":
      content = <PomodoroTool />;
      break;
    case "acad/metodos":
      content = <StudyMethods />;
      break;
    case "soc/reto":
      content = <ChallengeTool />;
      break;
    case "soc/situaciones":
      content = <SituationsTool />;
      break;
    case "soc/habilidades":
      content = <SocialSkills />;
      break;
    case "soc/desahogo":
      content = <VentTool />;
      break;
    case "fam/comunicacion":
      content = <CommunicationTool />;
      break;
    case "fam/limites":
      content = (
        <>
          <LimitsTool />
          <FamilyHelpNote />
        </>
      );
      break;
    case "iden/afirmaciones":
      content = <AffirmationsTool />;
      break;
    case "iden/autoaceptacion":
      content = <SelfAcceptance />;
      break;
    case "iden/organizaciones":
      content = <IdentityOrgs resources={getResources(profile.country)} />;
      break;
    default:
      notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/area/${area}`} className="self-start font-bold text-accent">
        ‹ {AREA_INFO[area].label}
      </Link>
      <h1 className="flex items-center gap-2 text-2xl font-black">
        <span aria-hidden>{def.emoji}</span> {def.title}
      </h1>
      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5">{content}</div>
    </div>
  );
}
