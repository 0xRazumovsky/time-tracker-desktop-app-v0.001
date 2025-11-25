import React, { useMemo } from "https://esm.sh/react@19.2.0";

const h = React.createElement;

export default function Reports({ tasks, formatTime }) {
  const summary = useMemo(() => {
    const totalSeconds = tasks.reduce((sum, task) => sum + (task.seconds || 0), 0);
    const avgSeconds = tasks.length ? Math.round(totalSeconds / tasks.length) : 0;
    const longest = tasks.reduce(
      (winner, task) => (task.seconds > (winner?.seconds || 0) ? task : winner),
      undefined,
    );
    const orderedTasks = tasks.slice().sort((a, b) => (b.seconds || 0) - (a.seconds || 0));

    return { totalSeconds, avgSeconds, longest, orderedTasks };
  }, [tasks]);

  const stat = (value, label) =>
    h("div", { className: "stat" }, [
      h("span", { className: "value" }, value),
      h("span", { className: "label" }, label),
    ]);

  return h("div", { className: "panel reports" }, [
    h("h2", null, "Reports"),
    h("p", { className: "muted" }, "Daily pulse on where your focus is going."),
    h("div", { className: "stats" }, [
      stat(formatTime(summary.totalSeconds), "Total focus"),
      stat(`${Math.round(summary.avgSeconds / 60)}m`, "Avg per task"),
      stat(summary.longest ? summary.longest.tag : "—", "Top tag"),
    ]),
    h(
      "div",
      { className: "report-list" },
      summary.orderedTasks.map((task) =>
        h("div", { key: task.id, className: "report-row" }, [
          h("div", null, [
            h("div", { className: "title" }, [
              h("span", { className: "color-chip", style: { background: task.color || "#67e8f9" } }),
              task.title,
            ]),
            h("div", { className: "tiny" }, task.tag || "Focus"),
          ]),
          h("div", { className: "time-small" }, formatTime(task.seconds || 0)),
        ]),
      ),
    ),
  ]);
}
