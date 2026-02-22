import { describe, it, expect, beforeEach } from "bun:test";
import { IgnoredPathsRegistry } from "./IgnoredPathsRegistry";

describe("IgnoredPathsRegistry", () => {
	let registry: IgnoredPathsRegistry;

	beforeEach(() => {
		registry = new IgnoredPathsRegistry();
	});

	it("should return false for path not in registry", () => {
		expect(registry.shouldIgnore("/some/path")).toBe(false);
	});

	it("should return true for path added to registry", () => {
		registry.add(["/agents/rules/foo.md"]);
		expect(registry.shouldIgnore("/agents/rules/foo.md")).toBe(true);
	});

	it("should normalize paths consistently", () => {
		registry.add(["/agents/rules/foo.md"]);
		expect(registry.shouldIgnore("/agents/rules/foo.md")).toBe(true);
		registry.add(["/agents/skills/bar.yaml"]);
		expect(registry.shouldIgnore("/agents/skills/bar.yaml")).toBe(true);
	});

	it("should return false after expiry", async () => {
		registry.add(["/agents/rules/foo.md"], 50);
		expect(registry.shouldIgnore("/agents/rules/foo.md")).toBe(true);
		await new Promise((r) => setTimeout(r, 60));
		expect(registry.shouldIgnore("/agents/rules/foo.md")).toBe(false);
	});

	it("should add multiple paths at once", () => {
		registry.add(["/a", "/b", "/c"]);
		expect(registry.shouldIgnore("/a")).toBe(true);
		expect(registry.shouldIgnore("/b")).toBe(true);
		expect(registry.shouldIgnore("/c")).toBe(true);
		expect(registry.shouldIgnore("/d")).toBe(false);
	});
});
