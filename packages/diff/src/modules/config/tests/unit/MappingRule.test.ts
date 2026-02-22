import { describe, it, expect } from 'bun:test';
import { MappingRule, MappingFormat } from '../../domain/value-objects/MappingRule';

describe('MappingRule - without format conversion', () => {
	it('creates rule without sourceExt/targetExt (backward compatible)', () => {
		const rule = MappingRule.create({
			from: 'rules/',
			to: 'rules/',
			format: MappingFormat.DIRECTORY,
		});

		expect(rule.from).toBe('rules/');
		expect(rule.to).toBe('rules/');
		expect(rule.format).toBe(MappingFormat.DIRECTORY);
		expect(rule.sourceExt).toBeUndefined();
		expect(rule.targetExt).toBeUndefined();
	});

	it('creates rule with minimal props (format defaults to FILE)', () => {
		const rule = MappingRule.create({ from: 'file.txt', to: 'file.txt' });
		expect(rule.format).toBe(MappingFormat.FILE);
		expect(rule.sourceExt).toBeUndefined();
		expect(rule.targetExt).toBeUndefined();
	});
});

describe('MappingRule - with format conversion', () => {
	it('creates rule with sourceExt and targetExt valid', () => {
		const rule = MappingRule.create({
			from: 'rules/',
			to: 'rules/',
			format: MappingFormat.DIRECTORY,
			sourceExt: '.mdc',
			targetExt: '.md',
		});

		expect(rule.sourceExt).toBe('.mdc');
		expect(rule.targetExt).toBe('.md');
	});

	it('accepts extensions with leading dot', () => {
		const rule = MappingRule.create({
			from: 'x',
			to: 'y',
			sourceExt: '.json',
			targetExt: '.yaml',
		});
		expect(rule.sourceExt).toBe('.json');
		expect(rule.targetExt).toBe('.yaml');
	});
});

describe('MappingRule - validation', () => {
	it('throws if only sourceExt is specified', () => {
		expect(() =>
			MappingRule.create({
				from: 'rules/',
				to: 'rules/',
				sourceExt: '.mdc',
			}),
		).toThrow('sourceExt and targetExt must both be specified or both omitted');
	});

	it('throws if only targetExt is specified', () => {
		expect(() =>
			MappingRule.create({
				from: 'rules/',
				to: 'rules/',
				targetExt: '.md',
			}),
		).toThrow('sourceExt and targetExt must both be specified or both omitted');
	});

	it('throws if sourceExt does not start with dot', () => {
		expect(() =>
			MappingRule.create({
				from: 'x',
				to: 'y',
				sourceExt: 'mdc',
				targetExt: '.md',
			}),
		).toThrow('sourceExt must start with a dot');
	});

	it('throws if targetExt does not start with dot', () => {
		expect(() =>
			MappingRule.create({
				from: 'x',
				to: 'y',
				sourceExt: '.mdc',
				targetExt: 'md',
			}),
		).toThrow('targetExt must start with a dot');
	});

	it('throws if from or to is empty', () => {
		expect(() =>
			MappingRule.create({ from: '', to: 'y' }),
		).toThrow('Mapping source and target paths are required');
		expect(() =>
			MappingRule.create({ from: 'x', to: '' }),
		).toThrow('Mapping source and target paths are required');
	});
});

describe('MappingRule - equals', () => {
	it('returns true for identical rules without format conversion', () => {
		const a = MappingRule.create({ from: 'rules/', to: 'rules/', format: MappingFormat.DIRECTORY });
		const b = MappingRule.create({ from: 'rules/', to: 'rules/', format: MappingFormat.DIRECTORY });
		expect(a.equals(b)).toBe(true);
	});

	it('returns true for identical rules with format conversion', () => {
		const a = MappingRule.create({
			from: 'rules/',
			to: 'rules/',
			sourceExt: '.mdc',
			targetExt: '.md',
		});
		const b = MappingRule.create({
			from: 'rules/',
			to: 'rules/',
			sourceExt: '.mdc',
			targetExt: '.md',
		});
		expect(a.equals(b)).toBe(true);
	});

	it('returns false when sourceExt differs', () => {
		const a = MappingRule.create({
			from: 'rules/',
			to: 'rules/',
			sourceExt: '.mdc',
			targetExt: '.md',
		});
		const b = MappingRule.create({
			from: 'rules/',
			to: 'rules/',
			sourceExt: '.md',
			targetExt: '.md',
		});
		expect(a.equals(b)).toBe(false);
	});

	it('returns false when targetExt differs', () => {
		const a = MappingRule.create({
			from: 'rules/',
			to: 'rules/',
			sourceExt: '.mdc',
			targetExt: '.md',
		});
		const b = MappingRule.create({
			from: 'rules/',
			to: 'rules/',
			sourceExt: '.mdc',
			targetExt: '.txt',
		});
		expect(a.equals(b)).toBe(false);
	});

	it('returns false when one has format conversion and the other does not', () => {
		const a = MappingRule.create({ from: 'rules/', to: 'rules/' });
		const b = MappingRule.create({
			from: 'rules/',
			to: 'rules/',
			sourceExt: '.mdc',
			targetExt: '.md',
		});
		expect(a.equals(b)).toBe(false);
	});
});
