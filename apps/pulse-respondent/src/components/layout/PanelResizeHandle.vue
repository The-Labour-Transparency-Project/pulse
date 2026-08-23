<script setup lang="ts">
import type { PanelSide } from "../../composables/useResizablePanels";

const props = defineProps<{ side: PanelSide; resizing: boolean }>();
const emit = defineEmits<{ resize: [event: PointerEvent]; nudge: [delta: number] }>();

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  const direction = event.key === "ArrowRight" ? 1 : -1;
  emit("nudge", props.side === "left" ? direction * 16 : direction * -16);
}
</script>

<template>
  <div
    :aria-label="`Resize ${side} panel`"
    :class="['panel-resize-handle', { 'is-resizing': resizing }]"
    role="separator"
    tabindex="0"
    @keydown="onKeydown"
    @pointerdown="$emit('resize', $event)"
  >
    <span />
  </div>
</template>

<style scoped>
.panel-resize-handle {
  align-items: center;
  cursor: col-resize;
  display: flex;
  justify-content: center;
  touch-action: none;
  user-select: none;
}

.panel-resize-handle span {
  background: transparent;
  border-radius: 999px;
  height: 48px;
  transition: background-color 120ms ease, width 120ms ease;
  width: 2px;
}

@media (max-width: 1279px) {
  .panel-resize-handle {
    display: none;
  }
}

.panel-resize-handle:hover span,
.panel-resize-handle:focus-visible span,
.panel-resize-handle.is-resizing span {
  background: rgb(var(--v-theme-primary));
  width: 3px;
}
</style>
