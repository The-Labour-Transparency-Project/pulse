import { describe, expect, it } from "vitest";
import { panelDefaultsForBreakpoint, panelLimitsForBreakpoint } from "./useResizablePanels";

describe("panel defaults", () => {
    it.each([
        ["xs", { left: 248, right: 280, tips: 280 }],
        ["sm", { left: 248, right: 280, tips: 280 }],
        ["md", { left: 280, right: 300, tips: 320 }],
        ["lg", { left: 412, right: 340, tips: 360 }],
        ["xl", { left: 660, right: 380, tips: 420 }],
    ] as const)("uses the %s Vuetify breakpoint settings", (breakpoint, expected) => {
        expect(panelDefaultsForBreakpoint(breakpoint)).toEqual(expected);
    });
    it("falls back to a usable layout for an unrecognised breakpoint", () => {
        expect(panelDefaultsForBreakpoint("unknown")).toEqual({ left: 248, right: 280, tips: 280 });
    });

    it("keeps Vuetify xxl on the xl desktop profile", () => {
        expect(panelDefaultsForBreakpoint("xxl")).toEqual({ left: 660, right: 380, tips: 420 });
    });
});

describe("panel limits", () => {
    it.each([
        ["xs", { left: { min: 248, max: 248 }, right: { min: 280, max: 280 }, tips: { min: 280, max: 280 } }],
        ["md", { left: { min: 280, max: 280 }, right: { min: 300, max: 300 }, tips: { min: 320, max: 320 } }],
        ["lg", { left: { min: 240, max: 660 }, right: { min: 280, max: 980 }, tips: { min: 280, max: 720 } }],
        ["xl", { left: { min: 240, max: 660 }, right: { min: 280, max: 980 }, tips: { min: 280, max: 760 } }],
        ["xxl", { left: { min: 240, max: 660 }, right: { min: 280, max: 980 }, tips: { min: 280, max: 760 } }],
    ] as const)("uses independent panel limits at %s", (breakpoint, expected) => {
        expect(panelLimitsForBreakpoint(breakpoint)).toEqual(expected);
    });
});
