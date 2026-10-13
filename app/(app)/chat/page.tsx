import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getResources } from "@/config/safety";
import { ChatClient } from "./ChatClient";

export const metadata: Metadata = { title: "Hablar con Lagun" };

export default async function ChatPage() {
  const { profile } = await requireProfile();
  return <ChatClient name={profile.display_name} resources={getResources(profile.country)} frogState={profile.frog_state} />;
}
