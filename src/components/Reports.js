import React, { useMemo } from "https://esm.sh/react@19.2.0";

const h = React.createElement;

export default function Reports({
  tasks,
  formatTime,
  activeRange = "7d",
  onRangeChange,
}) {
  const ranges = [
    { id: "today", label: "Day", days: 1 },
    { id: "7d", label: "Week", days: 7 },
    { id: "30d", label: "Month", days: 30 },
    { id: "90d", label: "3 mo", days: 90 },
    { id: "180d", label: "6 mo", days: 180 },
    { id: "365d", label: "Year", days: 365 },
    { id: "all", label: "All time", days: null },
  ];

  const summary = useMemo(() => {
    const now = Date.now();
    const rangeDef = ranges.find((r) => r.id === activeRange) || ranges[0];
    const filtered = tasks.filter((task) => {
      if (!rangeDef.days) return true;
      const started = task.startedAt || now;
      const ageMs = now - started;
      const limitMs = rangeDef.days * 24 * 60 * 60 * 1000;
      return ageMs <= limitMs;
    });

    const totalSeconds = filtered.reduce(
      (sum, task) => sum + (task.seconds || 0),
      0
    );
    const avgSeconds = filtered.length
      ? Math.round(totalSeconds / filtered.length)
      : 0;
    const longest = filtered.reduce(
      (winner, task) => (task.seconds > (winner?.seconds || 0) ? task : winner),
      undefined
    );
    const orderedTasks = filtered
      .slice()
      .sort((a, b) => (b.seconds || 0) - (a.seconds || 0));

    return {
      totalSeconds,
      avgSeconds,
      longest,
      orderedTasks,
      rangeLabel: rangeDef.label,
      isEmpty: filtered.length === 0,
    };
  }, [tasks, activeRange]);

  const stat = (value, label) =>
    h("div", { className: "stat" }, [
      h("span", { className: "value" }, value),
      h("span", { className: "label" }, label),
    ]);

  return h("div", { className: "panel reports" }, [
    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        },
      },
      [
        h("div", null, [
          h("h2", null, "Reports"),
          h("p", { className: "muted" }, `Range: ${summary.rangeLabel}`),
        ]),
        h(
          "div",
          { style: { display: "flex", gap: "6px", flexWrap: "wrap" } },
          ranges.map((range) =>
            h(
              "button",
              {
                key: range.id,
                className: range.id === activeRange ? "primary" : "ghost",
                type: "button",
                onClick: () => onRangeChange?.(range.id),
              },
              range.label
            )
          )
        ),
      ]
    ),
    summary.isEmpty
      ? h("p", { className: "muted" }, "No data available.")
      : h(React.Fragment, null, [
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
                    h("span", {
                      className: "color-chip",
                      style: { background: task.color || "#67e8f9" },
                    }),
                    task.title,
                  ]),
                  h("div", { className: "tiny" }, task.tag || "Focus"),
                ]),
                h(
                  "div",
                  { className: "time-small" },
                  formatTime(task.seconds || 0)
                ),
              ])
            )
          ),
        ]),
  ]);
}
