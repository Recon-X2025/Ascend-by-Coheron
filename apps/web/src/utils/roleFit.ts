/**
 * Single source of truth for Role Fit display (job cards and full Role Fit Analysis page).
 * - Score comes only from stored Role Fit Assessment (role_fit_assessments.fit_score).
 * - Full analysis (assess-fit) writes that value; job cards read it via stored-fit-scores.
 * - Never show a quick-estimate: if no stored assessment, show "Not analysed".
 */

export type RoleFitDisplayState =
  | { status: "score"; value: number }
  | { status: "loading" }
  | { status: "not_analysed" };

/**
 * Derive display state from stored score and loading flag.
 * Only a number from the stored Role Fit Assessment is shown as a score.
 */
export function getRoleFitDisplay(
  score: number | null | undefined,
  loading: boolean
): RoleFitDisplayState {
  if (loading) return { status: "loading" };
  if (score != null && typeof score === "number") return { status: "score", value: score };
  return { status: "not_analysed" };
}

/** CSS class for score badge background by value (shared with cards and full analysis). */
export function getRoleFitScoreBgClass(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-gray-400";
}

/** CSS class for score badge when used in a bordered/panel context. */
export function getRoleFitScorePanelClass(score: number): string {
  if (score >= 70) return "bg-emerald-500/10 border border-emerald-500/30";
  if (score >= 50) return "bg-amber-500/10 border border-amber-500/30";
  return "bg-muted border border-border";
}
