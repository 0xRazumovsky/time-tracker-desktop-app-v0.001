import React, { useMemo } from "https://esm.sh/react@19.2.0";

const h = React.createElement;

export default function Reports({
  tasks,
  sessions = [],
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
    const limitMs = rangeDef.days ? rangeDef.days * 24 * 60 * 60 * 1000 : null;

    const withinRange = (ts) => {
      if (!limitMs) return true;
      const age = now - ts;
      return age >= 0 && age <= limitMs;
    };

    const filteredSessions = sessions.filter((session) => {
      return withinRange(session.day);
    });

    const secondsByTask = tasks.reduce((acc, task) => {
      const anchor =
        task.startedAt ||
        task.started_at ||
        task.createdAt ||
        task.created_at ||
        task.updatedAt ||
        task.updated_at ||
        now;
      if (withinRange(anchor)) {
        acc[task.id] = (acc[task.id] || 0) + (task.seconds || 0);
      }
      return acc;
    }, {});

    filteredSessions.forEach((entry) => {
      secondsByTask[entry.taskId] = (secondsByTask[entry.taskId] || 0) + (entry.seconds || 0);
    });

    const totalSeconds = Object.values(secondsByTask).reduce(
      (sum, val) => sum + val,
      0
    );
    const orderedTasks = tasks
      .map((task) => ({ ...task, rangeSeconds: secondsByTask[task.id] || 0 }))
      .filter((task) => task.rangeSeconds > 0)
      .sort((a, b) => (b.rangeSeconds || 0) - (a.rangeSeconds || 0));

    const avgSeconds = orderedTasks.length
      ? Math.round(totalSeconds / orderedTasks.length)
      : 0;
    const longest = orderedTasks[0] || null;

    return {
      totalSeconds,
      avgSeconds,
      longest,
      orderedTasks,
      rangeLabel: rangeDef.label,
      isEmpty: orderedTasks.length === 0,
    };
  }, [tasks, sessions, activeRange]);

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
                  formatTime(task.rangeSeconds || 0)
                ),
              ])
            )
          ),
        ]),
  ]);
}
