import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { requireProfile } from "@/lib/auth";
import { getResources } from "@/config/safety";
import { isChatTopic } from "@/lib/companion-knowledge";
import { ChatClient } from "./ChatClient";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.titles.chat };
}

export default async function ChatPage({ searchParams }: PageProps<"/chat">) {
  const { profile } = await requireProfile();
  const { tema } = await searchParams;
  return (
    <ChatClient
      name={profile.display_name}
      resources={getResources(profile.country)}
      frogState={profile.frog_state}
      initialTopic={isChatTopic(tema) ? tema : "general"}
    />
  );
}
