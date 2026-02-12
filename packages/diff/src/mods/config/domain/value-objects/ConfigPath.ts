/**
 * Value object representing a configuration path.
 * Handles path normalization and basic validation without I/O.
 */
export class ConfigPath {
    private readonly path: string;

    constructor(path: string) {
        this.path = this.normalize(path);
    }

    /**
     * Normalizes the path (removes trailing slashes, etc.).
     * @param path - The path to normalize.
     * @returns Normalized path.
     */
    private normalize(path: string): string {
        return path.trim().replace(/\/+$/, '');
    }

    public getValue(): string {
        return this.path;
    }

    /**
     * Checks if the path is likely a local (project-relative) path.
     * @returns true if local.
     */
    public isLocal(): boolean {
        return this.path.startsWith('.') || (!this.path.startsWith('/') && !this.path.startsWith('~'));
    }

    /**
     * Checks if the path is a global (user-home) path.
     * @returns true if global.
     */
    public isGlobal(): boolean {
        return this.path.startsWith('~') || this.path.startsWith('/home') || this.path.startsWith('/Users');
    }

    /**
     * Checks for equality with another ConfigPath.
     * @param other - The other path to compare.
     * @returns true if equal.
     */
    public equals(other: ConfigPath): boolean {
        return this.path === other.getValue();
    }
}
