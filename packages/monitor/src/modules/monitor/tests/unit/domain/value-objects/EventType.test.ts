import { describe, it, expect } from 'bun:test';
import { EventType } from '@monitor/domain/value-objects/EventType';

describe('EventType', () => {
	describe('enum values', () => {
		it('should have CREATED value', () => {
			expect(EventType.CREATED).toBe('CREATED');
		});

		it('should have MODIFIED value', () => {
			expect(EventType.MODIFIED).toBe('MODIFIED');
		});

		it('should have DELETED value', () => {
			expect(EventType.DELETED).toBe('DELETED');
		});

		it('should have RENAMED value', () => {
			expect(EventType.RENAMED).toBe('RENAMED');
		});
	});

	describe('type checking', () => {
		it('should be usable as a string type', () => {
			const eventType: EventType = EventType.CREATED;
			expect(typeof eventType).toBe('string');
		});
	});
});
