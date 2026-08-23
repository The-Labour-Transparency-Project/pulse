import { computed, ref } from "vue";
import { useEventListener, useLocalStorage } from "@vueuse/core";
import { useDisplay } from "vuetify";

export type PanelSide = "left" | "right";
export type PanelBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";

const MIN_LEFT_WIDTH = 240;
const MAX_LEFT_WIDTH = 440;
const MIN_RIGHT_WIDTH = 280;
const MAX_RIGHT_WIDTH = 480;

export function panelDefaultsForBreakpoint(breakpoint: PanelBreakpoint) {
    switch (breakpoint) {
        case "xs":
        case "sm":
            return { left: 248, right: 280 };
        case "md":
            return { left: 280, right: 300 };
        case "lg":
            return { left: 312, right: 340 };
        case "xl":
            return { left: 360, right: 380 };
    }
}

function panelLimitsForBreakpoint(breakpoint: PanelBreakpoint) {
    if (breakpoint !== "lg" && breakpoint !== "xl") {
        return { left: 248, right: 280 };
    }
    if (breakpoint === "lg") {
        return { left: 312, right: 340 };
    }
    return { left: MAX_LEFT_WIDTH, right: MAX_RIGHT_WIDTH };
}

export function useResizablePanels() {
    const { name: displayBreakpoint, lgAndUp } = useDisplay();
    const breakpoint = computed(() => displayBreakpoint.value as PanelBreakpoint);
    const initialDefaults = panelDefaultsForBreakpoint(breakpoint.value);
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
        get: () => leftWidths.value[breakpoint.value] ?? initialDefaults.left,
        set: (value: number) => { leftWidths.value[breakpoint.value] = value; },
    });
    const rightWidth = computed({
        get: () => rightWidths.value[breakpoint.value] ?? initialDefaults.right,
        set: (value: number) => { rightWidths.value[breakpoint.value] = value; },
    });
    const questionNavigatorHidden = computed({
        get: () => questionNavigatorHiddenByBreakpoint.value[breakpoint.value] ?? !lgAndUp.value,
        set: (value: boolean) => { questionNavigatorHiddenByBreakpoint.value[breakpoint.value] = value; },
    });
    const effectiveLeftWidth = computed(() => Math.min(leftWidth.value, panelLimitsForBreakpoint(breakpoint.value).left));
    const effectiveRightWidth = computed(() => Math.min(rightWidth.value, panelLimitsForBreakpoint(breakpoint.value).right));
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
            leftWidth.value = Math.min(limits.left, Math.max(MIN_LEFT_WIDTH, dragStartWidth.value + delta));
        } else {
            rightWidth.value = Math.min(limits.right, Math.max(MIN_RIGHT_WIDTH, dragStartWidth.value - delta));
        }
    });

    useEventListener("pointerup", () => {
        resizing.value = null;
    });

    function nudge(side: PanelSide, delta: number) {
        const limits = panelLimitsForBreakpoint(breakpoint.value);
        if (side === "left") {
            leftWidthCustomized.value[breakpoint.value] = true;
            leftWidth.value = Math.min(limits.left, Math.max(MIN_LEFT_WIDTH, effectiveLeftWidth.value + delta));
        } else {
            rightWidthCustomized.value[breakpoint.value] = true;
            rightWidth.value = Math.min(limits.right, Math.max(MIN_RIGHT_WIDTH, effectiveRightWidth.value + delta));
        }
    }

    return { leftWidth, rightWidth, resizing, gridTemplateColumns, questionNavigatorHidden, startResize, nudge };
}
