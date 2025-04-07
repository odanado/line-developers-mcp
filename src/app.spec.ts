import { describe, it, expect } from "vitest";

describe("app", (): void => {
  describe("add", (): void => {
    it("should be correct", (): void => {
      expect.assertions(1);
      expect(32 + 10).toBe(42);
    });
  });
});
