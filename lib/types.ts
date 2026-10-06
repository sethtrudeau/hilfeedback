export type Role = "learner" | "evaluator";
export type ProjectStatus = "Active" | "Submitted" | "Evaluated";
export type ArtifactType = "written" | "audio" | "image" | "video" | "game" | "other";
export type AudioMode = "transcribe" | "listen";
export type RoutingLayer = "rule" | "manual";

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  written: "Written",
  audio: "Audio",
  image: "Image / drawing / schematic",
  video: "Video",
  game: "Game",
  other: "Other",
};

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  evaluator_id: number | null;
}

export interface RubricCriterion {
  name: string;
  description: string;
  levels: string[];
}

export interface Rubric {
  criteria: RubricCriterion[];
  standards: string[];
}

export interface Project {
  id: number;
  learner_id: number;
  evaluator_id: number;
  title: string;
  brief_text: string;
  brief_file: string | null;
  rubric_json: string | null;
  status: ProjectStatus;
  feedback_summary: string | null;
  summary_updated_at: string | null;
  created_at: string;
  submitted_at: string | null;
}

export interface Artifact {
  id: number;
  project_id: number;
  title: string;
  type: ArtifactType;
  created_at: string;
}

export interface ArtifactVersion {
  id: number;
  artifact_id: number;
  parent_version_id: number | null;
  version_number: number;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  text_content: string | null;
  link_url: string | null;
  learner_note: string | null;
  audio_mode: AudioMode | null;
  transcript: string | null;
  ai_reviewable: number;
  submitted_at: string;
}

export interface RoutingDecision {
  id: number;
  artifact_version_id: number;
  layer: RoutingLayer;
  reason: string;
  requested_by: number | null;
  status: "pending" | "resolved";
  created_at: string;
  resolved_at: string | null;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface FeedbackLog {
  id: number;
  artifact_version_id: number;
  source: "ai" | "human";
  author_id: number | null;
  messages_json: string;
  audio_file: string | null;
  transcript: string | null;
  created_at: string;
  updated_at: string;
}

export interface RubricScore {
  criterion: string;
  level: string;
  comment: string;
}

export interface Evaluation {
  id: number;
  project_id: number;
  evaluator_id: number;
  rubric_scores_json: string;
  comments: string;
  submitted_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  link: string;
  priority: "normal" | "high" | "low";
  read: number;
  created_at: string;
}
