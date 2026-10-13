export type Area = "acad" | "soc" | "fam" | "iden";
export const AREAS: Area[] = ["acad", "soc", "fam", "iden"];

export type FrogCategory = "color" | "hat" | "glasses" | "outfit" | "accessory" | "corner";
export type FrogState = Partial<Record<FrogCategory, string>>;

export type Theme = "light" | "dark" | "system";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  age_consent: boolean;
  theme: Theme;
  primary_area: Area | null;
  active_areas: Area[];
  frog_state: FrogState;
  points: number;
  end_of_day_checkin: boolean;
  checkin_hour: number;
  checkin_days: number[];
  notifications_enabled: boolean;
  timezone: string;
  country: string;
  onboarded_at: string | null;
  created_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  category: FrogCategory;
  cost: number;
  asset_key: string;
}

export interface FeedPost {
  id: number;
  type: "frase" | "historia" | "consejo";
  area: Area | "general";
  title: string;
  body: string;
  created_at: string;
}

export interface Exam {
  id: number;
  subject: string;
  title: string;
  due_date: string;
}

export type ActivityType =
  | "checkin"
  | "emotion"
  | "breathing"
  | "grounding"
  | "story"
  | "pomodoro"
  | "challenge"
  | "journal"
  | "module"
  | "chat"
  | "assessment";
