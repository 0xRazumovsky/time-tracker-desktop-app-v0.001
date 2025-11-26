import React, { useMemo, useState } from "https://esm.sh/react@19.2.0";

const h = React.createElement;

export default function TaskList({
  tasks,
  activeTaskId,
  onAddTask,
  onSelectTask,
  onStartTask,
  formatTime,
  isRunning,
  onEditTask,
  onDeleteTask,
}) {
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Focus");
  const [color, setColor] = useState("#67e8f9");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editColor, setEditColor] = useState("#67e8f9");

  const sortedTasks = useMemo(
    () => tasks.slice().sort((a, b) => (b.seconds || 0) - (a.seconds || 0)),
    [tasks],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    onAddTask(value, tag.trim(), color);
    setTitle("");
    setTag("Focus");
    setColor("#67e8f9");
  };

  const renderTask = (task) => {
    const isActive = task.id === activeTaskId;
    const isEditing = editingId === task.id;

    const beginEdit = () => {
      setEditingId(task.id);
      setEditTitle(task.title);
      setEditTag(task.tag || "");
      setEditColor(task.color || "#67e8f9");
    };

    const commitEdit = () => {
      if (!editTitle.trim()) return;
      onEditTask?.(task.id, {
        title: editTitle.trim(),
        tag: editTag.trim() || "Focus",
        color: editColor,
      });
      setEditingId(null);
    };

    return h(
      "div",
      { key: task.id, className: `task ${isActive ? "active" : ""}` },
      [
        isEditing
          ? h("div", { style: { display: "grid", gap: "8px" } }, [
              h("input", {
                className: "input",
                value: editTitle,
                onChange: (event) => setEditTitle(event.target.value),
              }),
              h("input", {
                className: "input",
                value: editTag,
                onChange: (event) => setEditTag(event.target.value),
              }),
              h(
                "div",
                { style: { display: "flex", gap: "8px", alignItems: "center" } },
                [
                  h("span", { className: "tiny" }, "Color"),
                  ["#67e8f9", "#34d399", "#a5b4fc", "#fbbf24", "#f472b6"].map((swatch) =>
                    h(
                      "button",
                      {
                        key: swatch,
                        type: "button",
                        className: `swatch ${editColor === swatch ? "active" : ""}`,
                        style: { background: swatch },
                        onClick: () => setEditColor(swatch),
                      },
                      " ",
                    ),
                  ),
                ],
              ),
            ])
          : h("div", null, [
              h("h3", null, task.title),
              h("div", { className: "meta" }, [
                h("span", {
                  className: "tag",
                  style: { borderColor: task.color, background: `${task.color || "#67e8f9"}22` },
                }, task.tag || "Focus"),
                h("span", { className: "time-small" }, formatTime(task.seconds || 0)),
                h("span", { className: "tiny" }, task.status || "In queue"),
              ]),
            ]),
        h("div", { className: "task-actions", style: { display: "flex", gap: "8px" } }, [
          isEditing
            ? h(
                "button",
                {
                  className: "primary",
                  type: "button",
                  onClick: commitEdit,
                },
                "Save",
              )
            : h(
                "button",
                {
                  className: "ghost",
                  type: "button",
                  onClick: beginEdit,
                },
                "Edit",
              ),
          isEditing &&
            h(
              "button",
              {
                className: "ghost",
                type: "button",
                onClick: () => setEditingId(null),
              },
              "Cancel",
            ),
          h(
            "button",
            {
              className: "ghost",
              type: "button",
              onClick: () => onDeleteTask?.(task.id),
            },
            "Delete",
          ),
        ]),
      ],
    );
  };

  return h("div", { className: "panel task-list" }, [
    h("h2", null, "Task list"),
    h("p", { className: "muted" }, "Queue and shuffle sessions without losing calm."),
    h(
      "div",
      { className: "task-items" },
      sortedTasks.map(renderTask),
    ),
    h(
      "form",
      { onSubmit: handleSubmit },
      [
        h(
          "div",
          { style: { display: "grid", gap: "8px" } },
          [
            h("input", {
              className: "input",
              type: "text",
              placeholder: "Add a quick task (e.g. Retro notes)",
              value: title,
              onChange: (event) => setTitle(event.target.value),
            }),
            h("input", {
              className: "input",
              type: "text",
              placeholder: "Tag (optional)",
              value: tag,
              onChange: (event) => setTag(event.target.value),
            }),
            h(
              "div",
              { style: { display: "flex", gap: "8px", alignItems: "center" } },
              [
                h("span", { className: "tiny" }, "Color"),
                ["#67e8f9", "#34d399", "#a5b4fc", "#fbbf24", "#f472b6"].map((swatch) =>
                  h(
                    "button",
                    {
                      key: swatch,
                      type: "button",
                      className: `swatch ${color === swatch ? "active" : ""}`,
                      style: { background: swatch },
                      onClick: () => setColor(swatch),
                    },
                    " ",
                  ),
                ),
              ],
            ),
          ],
        ),
        h(
          "button",
          { type: "submit", className: "primary" },
          "Save + queue",
        ),
      ],
    ),
  ]);
}
