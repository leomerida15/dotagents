import { normalize } from 'node:path';

const DEFAULT_EXPIRY_MS = 600;

/**
 * Tracks paths that should be temporarily ignored by file watchers.
 * Used to prevent sync loops when the motor writes files that would otherwise
 * trigger reactive sync (Sprint 4).
 */
export class IgnoredPathsRegistry {
	private readonly entries = new Map<string, number>();

	/**
	 * Adds paths to the ignore list with a time-based expiry.
	 * @param paths Paths to ignore (absolute or relative; will be normalized)
	 * @param expiryMs Milliseconds until each path expires. Default 600ms.
	 */
	add(paths: string[], expiryMs = DEFAULT_EXPIRY_MS): void {
		const expiryAt = Date.now() + expiryMs;
		for (const p of paths) {
			const key = normalize(p);
			this.entries.set(key, expiryAt);
		}
	}

	/**
	 * Returns true if the path should be ignored (present and not expired).
	 * Cleans expired entries before checking.
	 * @param path Path to check (e.g. uri.fsPath from watcher)
	 */
	shouldIgnore(path: string): boolean {
		this.cleanExpired();
		const key = normalize(path);
		return this.entries.has(key);
	}

	private cleanExpired(): void {
		const now = Date.now();
		const toDelete: string[] = [];
		for (const [key, expiry] of this.entries) {
			if (expiry <= now) toDelete.push(key);
		}
		for (const key of toDelete) {
			this.entries.delete(key);
		}
	}
}
