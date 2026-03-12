/**
 * Port: Contract for the error formatter.
 */
export interface IErrorFormatter {
	/**
	 * Formats an error into a readable string.
	 * @param error - The error object or message to format.
	 * @returns A string representation of the formatted error.
	 */
	format(error: unknown): string;
}
