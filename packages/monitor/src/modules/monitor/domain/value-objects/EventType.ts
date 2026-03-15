/**
 * EventType value object enumeration.
 * Represents the types of file system events that can occur.
 */

/**
 * Enumeration of file system event types.
 */
export enum EventType {
	/** File or directory was created */
	CREATED = 'CREATED',
	/** File or directory was modified */
	MODIFIED = 'MODIFIED',
	/** File or directory was deleted */
	DELETED = 'DELETED',
	/** File or directory was renamed */
	RENAMED = 'RENAMED',
}
