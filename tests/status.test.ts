import { describe, it, expect } from "vitest";
import { normalizeStatus } from "../src/lib/status";

describe("normalizeStatus", () => {
  it("maps legacy statuses", () => {
    expect(normalizeStatus("DONE")).toBe("GRADED");
    expect(normalizeStatus("IN_PROGRESS")).toBe("SUBMITTED");
    expect(normalizeStatus("TODO")).toBe("NOT_SUBMITTED");
  });
  it("passes through valid statuses", () => {
    expect(normalizeStatus("NOT_SUBMITTED")).toBe("NOT_SUBMITTED");
    expect(normalizeStatus("SUBMITTED")).toBe("SUBMITTED");
    expect(normalizeStatus("GRADED")).toBe("GRADED");
  });
  it("defaults unknown/empty to NOT_SUBMITTED", () => {
    expect(normalizeStatus(undefined)).toBe("NOT_SUBMITTED");
    expect(normalizeStatus(null as any)).toBe("NOT_SUBMITTED");
    expect(normalizeStatus("WHATEVER")).toBe("NOT_SUBMITTED");
  });
});


