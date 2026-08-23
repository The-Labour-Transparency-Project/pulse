import { computed, ref } from "vue";
import { useEventListener, useLocalStorage } from "@vueuse/core";
import { useDisplay } from "vuetify";

export type PanelSide = "left" | "right";
export type PanelBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";
export type PanelWidthLimits = { min: number; max: number };
export type PanelLimits = { left: PanelWidthLimits; right: PanelWidthLimits };

const MIN_LEFT_WIDTH = 240;
const MAX_LEFT_WIDTH = 660;
const MIN_RIGHT_WIDTH = 280;
const MAX_RIGHT_WIDTH = 980;

export function panelDefaultsForBreakpoint(breakpoint: PanelBreakpoint | string) {
    switch (breakpoint) {
        case "xs":
        case "sm":
            return { left: 248, right: 280 };
        case "md":
            return { left: 280, right: 300 };
        case "lg":
            return { left: 412, right: 640 };
        case "xl":
        case "xxl":
            return { left: 660, right: 980 };
        default:
            // Vuetify can briefly expose an unrecognised value while its
            // display service is initialising. Keep the panel layout usable
            // until a supported breakpoint is available.
            return { left: 248, right: 280 };
    }
}

function normalizePanelBreakpoint(breakpoint: string): PanelBreakpoint {
    switch (breakpoint) {
        case "xs":
        case "sm":
        case "md":
        case "lg":
        case "xl":
            return breakpoint;
        case "xxl":
            // Vuetify has a display breakpoint above xl, but panel sizing
            // intentionally uses the same desktop profile for both.
            return "xl";
        default:
            return "xs";
    }
}

const PANEL_LIMITS: Record<PanelBreakpoint, PanelLimits> = {
    xs: { left: { min: 248, max: 248 }, right: { min: 280, max: 280 } },
    sm: { left: { min: 248, max: 248 }, right: { min: 280, max: 280 } },
    md: { left: { min: 280, max: 280 }, right: { min: 300, max: 300 } },
    lg: { left: { min: MIN_LEFT_WIDTH, max: MAX_LEFT_WIDTH }, right: { min: MIN_RIGHT_WIDTH, max: MAX_RIGHT_WIDTH } },
    xl: { left: { min: MIN_LEFT_WIDTH, max: MAX_LEFT_WIDTH }, right: { min: MIN_RIGHT_WIDTH, max: MAX_RIGHT_WIDTH } },
};

export function panelLimitsForBreakpoint(breakpoint: PanelBreakpoint | string): PanelLimits {
    return PANEL_LIMITS[normalizePanelBreakpoint(breakpoint)];
}

export function useResizablePanels() {
    const { name: displayBreakpoint, lgAndUp } = useDisplay();
    const breakpoint = computed(() => normalizePanelBreakpoint(displayBreakpoint.value));
    const leftWidths = useLocalStorage<Record<PanelBreakpoint, number>>("pulse-respondent-left-panel-widths", {
        xs: 248, sm: 248, md: 280, lg: 312, xl: 360,
    });
    const rightWidths = useLocalStorage<Record<PanelBreakpoint, number>>("pulse-respondent-right-panel-widths", {
        xs: 280, sm: 280, md: 300, lg: 340, xl: 380,
    });
    const leftWidthCustomized = useLocalStorage<Record<PanelBreakpoint, boolean>>("pulse-respondent-left-panel-customized", {
        xs: false, sm: false, md: false, lg: false, xl: false,
    });
    const rightWidthCustomized = useLocalStorage<Record<PanelBreakpoint, boolean>>("pulse-respondent-right-panel-customized", {
        xs: false, sm: false, md: false, lg: false, xl: false,
    });
    const questionNavigatorHiddenByBreakpoint = useLocalStorage<Record<PanelBreakpoint, boolean>>(
        "pulse-respondent-question-navigator-hidden",
        { xs: true, sm: true, md: true, lg: false, xl: false },
    );
    const resizing = ref<PanelSide | null>(null);
    const dragStartX = ref(0);
    const dragStartWidth = ref(0);

    const leftWidth = computed({
        get: () => leftWidths.value[breakpoint.value] ?? panelDefaultsForBreakpoint(breakpoint.value).left,
        set: (value: number) => { leftWidths.value[breakpoint.value] = value; },
    });
    const rightWidth = computed({
        get: () => rightWidths.value[breakpoint.value] ?? panelDefaultsForBreakpoint(breakpoint.value).right,
        set: (value: number) => { rightWidths.value[breakpoint.value] = value; },
    });
    const questionNavigatorHidden = computed({
        get: () => questionNavigatorHiddenByBreakpoint.value[breakpoint.value] ?? !lgAndUp.value,
        set: (value: boolean) => { questionNavigatorHiddenByBreakpoint.value[breakpoint.value] = value; },
    });
    const effectiveLeftWidth = computed(() => {
        const limits = panelLimitsForBreakpoint(breakpoint.value);
        return Math.min(limits.left.max, Math.max(limits.left.min, leftWidth.value));
    });
    const effectiveRightWidth = computed(() => {
        const limits = panelLimitsForBreakpoint(breakpoint.value);
        return Math.min(limits.right.max, Math.max(limits.right.min, rightWidth.value));
    });
    const gridTemplateColumns = computed(() =>
        `${effectiveLeftWidth.value}px 8px minmax(0, 1fr) 8px ${effectiveRightWidth.value}px`,
    );

    function startResize(side: PanelSide, event: PointerEvent) {
        if (!lgAndUp.value) return;
        if (side === "left") leftWidthCustomized.value[breakpoint.value] = true;
        else rightWidthCustomized.value[breakpoint.value] = true;
        resizing.value = side;
        dragStartX.value = event.clientX;
        dragStartWidth.value = side === "left" ? effectiveLeftWidth.value : effectiveRightWidth.value;
        (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
        event.preventDefault();
    }

    useEventListener("pointermove", (event) => {
        if (!resizing.value) return;
        const delta = event.clientX - dragStartX.value;
        const limits = panelLimitsForBreakpoint(breakpoint.value);
        if (resizing.value === "left") {
            leftWidth.value = Math.min(limits.left.max, Math.max(limits.left.min, dragStartWidth.value + delta));
        } else {
            rightWidth.value = Math.min(limits.right.max, Math.max(limits.right.min, dragStartWidth.value - delta));
        }
    });

    useEventListener("pointerup", () => {
        resizing.value = null;
    });

    function nudge(side: PanelSide, delta: number) {
        const limits = panelLimitsForBreakpoint(breakpoint.value);
        if (side === "left") {
            leftWidthCustomized.value[breakpoint.value] = true;
            leftWidth.value = Math.min(limits.left.max, Math.max(limits.left.min, effectiveLeftWidth.value + delta));
        } else {
            rightWidthCustomized.value[breakpoint.value] = true;
            rightWidth.value = Math.min(limits.right.max, Math.max(limits.right.min, effectiveRightWidth.value + delta));
        }
    }

    return { leftWidth, rightWidth, resizing, gridTemplateColumns, questionNavigatorHidden, startResize, nudge };
}
