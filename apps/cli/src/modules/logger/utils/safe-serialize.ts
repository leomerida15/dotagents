/**
 * Safely serializes a value to JSON without throwing on circular references.
 * Creates a new WeakSet for each call to track seen objects.
 * @param value - The value to serialize
 * @returns JSON string or fallback string representation
 */
export function safeSerialize(value: unknown): string {
	const seen = new WeakSet();
	try {
		return JSON.stringify(value, (_key, val) => {
			if (typeof val === 'object' && val !== null) {
				if (seen.has(val)) {
					return '[Circular]';
				}
				seen.add(val);
			}
			return val;
		});
	} catch {
		return String(value);
	}
}
