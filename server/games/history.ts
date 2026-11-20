import { GameError } from "./core.js";
export type ContentHistory = Map<string, Set<string>>;
export function available<T>(
  history: ContentHistory,
  kind: string,
  pool: T[],
  key: (item: T) => string,
): T[] {
  const seen = history.get(kind);
  return pool.filter((item) => !seen?.has(key(item)));
}
export function remember(history: ContentHistory, kind: string, key: string) {
  const seen = history.get(kind) ?? new Set<string>();
  seen.add(key);
  history.set(kind, seen);
}
export function requireFresh(count: number, available: number, label: string) {
  if (available < count)
    throw new GameError(
      "content_exhausted",
      `Not enough fresh ${label} for another game. Choose another game or reset used content in the lobby.`,
    );
}
