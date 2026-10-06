import { db } from "./db";
import type {
  Artifact,
  ArtifactVersion,
  ChatTurn,
  Evaluation,
  FeedbackLog,
  Project,
  Rubric,
  RoutingDecision,
  User,
} from "./types";

export function getUser(id: number): User | undefined {
  return db().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function getProject(id: number): Project | undefined {
  return db().prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project | undefined;
}

export function canAccessProject(user: User, project: Project): boolean {
  return user.role === "learner" ? project.learner_id === user.id : project.evaluator_id === user.id;
}

/** Returns the project only if the user may see it. */
export function getProjectFor(user: User, id: number): Project | undefined {
  const project = getProject(id);
  return project && canAccessProject(user, project) ? project : undefined;
}

export function parseRubric(project: Project): Rubric | null {
  return project.rubric_json ? (JSON.parse(project.rubric_json) as Rubric) : null;
}

export interface ProjectRow extends Project {
  learner_name: string;
  artifact_count: number;
  pending_count: number;
}

const PROJECT_ROW_SQL = `
  SELECT p.*, u.name AS learner_name,
    (SELECT COUNT(*) FROM artifacts a WHERE a.project_id = p.id) AS artifact_count,
    (SELECT COUNT(*) FROM routing_decisions r
       JOIN artifact_versions v ON v.id = r.artifact_version_id
       JOIN artifacts a ON a.id = v.artifact_id
     WHERE a.project_id = p.id AND r.status = 'pending') AS pending_count
  FROM projects p JOIN users u ON u.id = p.learner_id`;

export function listLearnerProjects(learnerId: number): ProjectRow[] {
  return db()
    .prepare(`${PROJECT_ROW_SQL} WHERE p.learner_id = ? ORDER BY p.created_at DESC`)
    .all(learnerId) as ProjectRow[];
}

export function listEvaluatorLearners(evaluatorId: number): (User & { projects: ProjectRow[] })[] {
  const learners = db()
    .prepare("SELECT * FROM users WHERE role = 'learner' AND evaluator_id = ? ORDER BY name")
    .all(evaluatorId) as User[];
  const projects = db()
    .prepare(`${PROJECT_ROW_SQL} WHERE p.evaluator_id = ? ORDER BY p.created_at DESC`)
    .all(evaluatorId) as ProjectRow[];
  return learners.map((l) => ({ ...l, projects: projects.filter((p) => p.learner_id === l.id) }));
}

export interface ArtifactWithVersions extends Artifact {
  versions: ArtifactVersion[]; // oldest first
}

export function listArtifacts(projectId: number): ArtifactWithVersions[] {
  const artifacts = db()
    .prepare("SELECT * FROM artifacts WHERE project_id = ? ORDER BY created_at, id")
    .all(projectId) as Artifact[];
  const versions = db()
    .prepare(
      `SELECT v.* FROM artifact_versions v JOIN artifacts a ON a.id = v.artifact_id
       WHERE a.project_id = ? ORDER BY v.version_number`,
    )
    .all(projectId) as ArtifactVersion[];
  return artifacts.map((a) => ({ ...a, versions: versions.filter((v) => v.artifact_id === a.id) }));
}

export interface VersionDetail extends ArtifactVersion {
  artifact_title: string;
  artifact_type: Artifact["type"];
  project_id: number;
}

export function getVersion(id: number): VersionDetail | undefined {
  return db()
    .prepare(
      `SELECT v.*, a.title AS artifact_title, a.type AS artifact_type, a.project_id
       FROM artifact_versions v JOIN artifacts a ON a.id = v.artifact_id WHERE v.id = ?`,
    )
    .get(id) as VersionDetail | undefined;
}

export function listVersions(artifactId: number): ArtifactVersion[] {
  return db()
    .prepare("SELECT * FROM artifact_versions WHERE artifact_id = ? ORDER BY version_number")
    .all(artifactId) as ArtifactVersion[];
}

export function getAiLog(versionId: number): FeedbackLog | undefined {
  return db()
    .prepare("SELECT * FROM feedback_logs WHERE artifact_version_id = ? AND source = 'ai'")
    .get(versionId) as FeedbackLog | undefined;
}

export function aiTurns(versionId: number): ChatTurn[] {
  const log = getAiLog(versionId);
  return log ? (JSON.parse(log.messages_json) as ChatTurn[]) : [];
}

export interface HumanFeedback extends FeedbackLog {
  author_name: string;
  text: string;
}

export function humanFeedback(versionId: number): HumanFeedback[] {
  const rows = db()
    .prepare(
      `SELECT f.*, u.name AS author_name FROM feedback_logs f JOIN users u ON u.id = f.author_id
       WHERE f.artifact_version_id = ? AND f.source = 'human' ORDER BY f.created_at`,
    )
    .all(versionId) as (FeedbackLog & { author_name: string })[];
  return rows.map((r) => ({
    ...r,
    text: (JSON.parse(r.messages_json) as ChatTurn[]).map((m) => m.content).join("\n\n"),
  }));
}

export function routingDecisions(versionId: number): RoutingDecision[] {
  return db()
    .prepare("SELECT * FROM routing_decisions WHERE artifact_version_id = ? ORDER BY created_at")
    .all(versionId) as RoutingDecision[];
}

/** Version ids in a project that have a pending human review. */
export function pendingVersionIds(projectId: number): Set<number> {
  const rows = db()
    .prepare(
      `SELECT DISTINCT r.artifact_version_id AS id FROM routing_decisions r
       JOIN artifact_versions v ON v.id = r.artifact_version_id
       JOIN artifacts a ON a.id = v.artifact_id
       WHERE a.project_id = ? AND r.status = 'pending'`,
    )
    .all(projectId) as { id: number }[];
  return new Set(rows.map((r) => r.id));
}

export interface PendingItem extends RoutingDecision {
  version_number: number;
  artifact_title: string;
  artifact_type: Artifact["type"];
  audio_mode: ArtifactVersion["audio_mode"];
  file_path: string | null;
  project_id: number;
  project_title: string;
  learner_name: string;
  requested_by_role: User["role"] | null;
}

export function pendingQueue(evaluatorId: number): PendingItem[] {
  return db()
    .prepare(
      `SELECT r.*, v.version_number, v.audio_mode, v.file_path, a.title AS artifact_title, a.type AS artifact_type,
              p.id AS project_id, p.title AS project_title, l.name AS learner_name,
              rb.role AS requested_by_role
       FROM routing_decisions r
       JOIN artifact_versions v ON v.id = r.artifact_version_id
       JOIN artifacts a ON a.id = v.artifact_id
       JOIN projects p ON p.id = a.project_id
       JOIN users l ON l.id = p.learner_id
       LEFT JOIN users rb ON rb.id = r.requested_by
       WHERE p.evaluator_id = ? AND r.status = 'pending'
       ORDER BY r.created_at`,
    )
    .all(evaluatorId) as PendingItem[];
}

export function submittedProjects(evaluatorId: number): ProjectRow[] {
  return db()
    .prepare(`${PROJECT_ROW_SQL} WHERE p.evaluator_id = ? AND p.status = 'Submitted' ORDER BY p.submitted_at`)
    .all(evaluatorId) as ProjectRow[];
}

export function getEvaluation(projectId: number): Evaluation | undefined {
  return db().prepare("SELECT * FROM evaluations WHERE project_id = ?").get(projectId) as Evaluation | undefined;
}

export function unreadCount(userId: number): number {
  return (
    db().prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read = 0").get(userId) as {
      n: number;
    }
  ).n;
}

export function pendingCount(evaluatorId: number): number {
  return pendingQueue(evaluatorId).length + submittedProjects(evaluatorId).length;
}

export function humanFeedbackCount(projectId: number): number {
  return (
    db()
      .prepare(
        `SELECT COUNT(*) AS n FROM feedback_logs f
         JOIN artifact_versions v ON v.id = f.artifact_version_id
         JOIN artifacts a ON a.id = v.artifact_id WHERE a.project_id = ? AND f.source = 'human'`,
      )
      .get(projectId) as { n: number }
  ).n;
}

/** Latest time anything in the project changed; used to tell if the AI summary is stale. */
export function lastActivity(projectId: number): string | null {
  const row = db()
    .prepare(
      `SELECT MAX(f.updated_at) AS t FROM feedback_logs f
       JOIN artifact_versions v ON v.id = f.artifact_version_id
       JOIN artifacts a ON a.id = v.artifact_id WHERE a.project_id = ?`,
    )
    .get(projectId) as { t: string | null };
  return row.t;
}
