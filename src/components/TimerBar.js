import React from "https://esm.sh/react@19.2.0";

const h = React.createElement;

export default function TimerBar({
  activeTask,
  elapsedSeconds,
  isRunning,
  formatTime,
  onStart,
  onPause,
  onReset,
}) {
  const targetSeconds = 45 * 60;
  const percent = activeTask ? Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100)) : 0;
  const accentStyle = activeTask?.color ? { borderColor: activeTask.color, background: `${activeTask.color}22` } : undefined;

  return h("div", { className: "panel timer-bar" }, [
    h("div", { className: "timer-meta" }, [
      h("div", null, [
        h(
          "p",
          { className: "muted" },
          activeTask ? `${activeTask.tag || "Focus"} session` : "Pick a task to begin",
        ),
        h("div", { className: "time-readout" }, [
          formatTime(elapsedSeconds),
          h("span", null, "of 45m target"),
        ]),
      ]),
      h("div", { className: "pill", style: accentStyle }, [
        h("span", { className: "color-chip", style: { background: activeTask?.color || "#67e8f9" } }),
        h("strong", null, activeTask ? activeTask.title : "No task selected"),
      ]),
    ]),
    h("div", { className: "progress", "aria-label": "Session progress" }, [
      h("div", { className: "fill", style: { width: `${percent}%` } }),
    ]),
    h("div", { className: "timer-actions" }, [
      h(
        "button",
        {
          className: "primary",
          onClick: isRunning ? onPause : onStart,
          disabled: !activeTask,
        },
        isRunning ? "Pause focus" : "Start focus",
      ),
      h(
        "button",
        {
          className: "ghost",
          onClick: onReset,
          disabled: !activeTask,
        },
        "Reset timer",
      ),
    ]),
  ]);
}
