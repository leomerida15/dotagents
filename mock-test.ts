
import { expect, test, mock } from "bun:test";
import { stat } from "node:fs/promises";

mock.module("node:fs/promises", () => ({
    stat: () => Promise.resolve({ mtimeMs: 123 }),
    access: () => Promise.resolve(),
}));

test("mock works", async () => {
    const s = await stat("foo");
    expect(s.mtimeMs).toBe(123);
});
