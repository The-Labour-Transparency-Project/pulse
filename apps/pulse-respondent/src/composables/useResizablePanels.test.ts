import { describe, expect, it } from "vitest";
import { panelDefaultsForBreakpoint } from "./useResizablePanels";

describe("panel defaults", () => {
    it.each([
        ["xs", { left: 248, right: 280 }],
        ["sm", { left: 248, right: 280 }],
        ["md", { left: 280, right: 300 }],
        ["lg", { left: 312, right: 340 }],
        ["xl", { left: 360, right: 380 }],
    ] as const)("uses the %s Vuetify breakpoint settings", (breakpoint, expected) => {
        expect(panelDefaultsForBreakpoint(breakpoint)).toEqual(expected);
    });
});
