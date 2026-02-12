/**
 * Port for file system operations, abstracting Bun's fs module.
 */
export interface IFileSystem {
    /**
     * Reads the content of a file.
     */
    readFile(path: string): Promise<string>;

    /**
     * Writes content to a file.
     */
    writeFile(path: string, content: string): Promise<void>;

    /**
     * Deletes a file or directory.
     */
    delete(path: string): Promise<void>;

    /**
     * Checks if a path exists.
     */
    exists(path: string): Promise<boolean>;

    /**
     * Copies a file or directory.
     */
    copy(source: string, target: string): Promise<void>;

    /**
     * Creates a directory.
     */
    mkdir(path: string): Promise<void>;

    /**
     * Lists contents of a directory.
     */
    readDir(path: string): Promise<string[]>;
}
