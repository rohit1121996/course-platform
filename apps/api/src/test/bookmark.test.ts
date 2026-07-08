import { describe, expect, test } from "bun:test";
import { determineSaveAction, determineUnsaveAction, calculateNetSaves } from "../domain/bookmark";

describe("Bookmark Domain Logic", () => {
  describe("determineSaveAction", () => {
    test("should return 'insert' if activeSavesCount is 0", () => {
      expect(determineSaveAction(0)).toBe("insert");
    });

    test("should return 'noop' if activeSavesCount is greater than 0", () => {
      expect(determineSaveAction(1)).toBe("noop");
      expect(determineSaveAction(5)).toBe("noop");
    });
  });

  describe("determineUnsaveAction", () => {
    test("should return 'soft_delete' if activeSavesCount is greater than 0", () => {
      expect(determineUnsaveAction(1)).toBe("soft_delete");
      expect(determineUnsaveAction(5)).toBe("soft_delete");
    });

    test("should return 'noop' if activeSavesCount is 0", () => {
      expect(determineUnsaveAction(0)).toBe("noop");
    });
  });

  describe("calculateNetSaves", () => {
    test("should correctly calculate net saves", () => {
      expect(calculateNetSaves(10, 5)).toBe(5);
    });

    test("should never return a negative number", () => {
      expect(calculateNetSaves(5, 10)).toBe(0);
    });
  });
});
