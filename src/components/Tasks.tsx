
import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  [key: string]: unknown;
};

const STORAGE_KEY = "focusflow_tasks";

function loadTasks(): Task[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (item): item is Record<string, unknown> =>
              item !== null &&
              typeof item === "object" &&
              typeof item.id === "number" &&
              typeof item.title === "string"
          )
          .map((item) => ({
            ...item,
            id: item.id as number,
            title: item.title as string,
            completed: Boolean(item.completed),
          }));
      }
    }
  } catch (error) {
    console.error("Unable to load tasks:", error);
  }

  return [];
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  const [showInput, setShowInput] = useState(false);
  const [newTask, setNewTask] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("Unable to save tasks:", error);
    }
  }, [tasks]);

  function addTask() {
    if (!newTask.trim()) return;

    const task: Task = {
      id: Date.now(),
      title: newTask.trim(),
      completed: false,
      description: "",
      priority: "medium",
      dueDate: "",
      category: "study",
      subtasks: [],
      recurrence: "none",
    };

    setTasks((previous) => [...previous, task]);
    setNewTask("");
    setShowInput(false);
  }

  function toggleTask(id: number) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  function deleteTask(id: number) {
    setTasks((previous) =>
      previous.filter((task) => task.id !== id)
    );

    if (editingId === id) {
      setEditingId(null);
      setEditTitle("");
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
  }

  function saveEdit() {
    if (!editTitle.trim() || editingId === null) return;

    setTasks((previous) =>
      previous.map((task) =>
        task.id === editingId
          ? { ...task, title: editTitle.trim() }
          : task
      )
    );

    setEditingId(null);
    setEditTitle("");
  }

  function clearCompleted() {
    setTasks((previous) =>
      previous.filter((task) => !task.completed)
    );

    setShowMenu(false);
  }

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  return (
    <section className="compact-task-section">

      {/* Header */}
      <div className="compact-task-header">
        <div className="compact-task-title">
          <h2>Tasks</h2>

          {tasks.length > 0 && (
            <span className="compact-task-count">
              {completedCount}/{tasks.length} Completed
            </span>
          )}
        </div>

        <div className="compact-task-menu-wrapper">
          <button
            className="compact-task-menu-btn"
            onClick={() => setShowMenu((previous) => !previous)}
            aria-label="Task options"
            aria-expanded={showMenu}
          >
            ⋮
          </button>

          {showMenu && (
            <div className="compact-task-menu">
              <button
                onClick={clearCompleted}
                disabled={completedCount === 0}
              >
                Clear Completed
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="compact-task-list">
        {tasks.map((task) => (
          <div
            className={`compact-task-item ${
              task.completed ? "is-completed" : ""
            }`}
            key={task.id}
          >
            {editingId === task.id ? (
              <div className="compact-task-edit">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(event) =>
                    setEditTitle(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveEdit();
                    if (event.key === "Escape") {
                      setEditingId(null);
                      setEditTitle("");
                    }
                  }}
                  autoFocus
                />

                <button onClick={saveEdit}>Save</button>

                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditTitle("");
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <label className="compact-task-label">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />

                  <span>{task.title}</span>
                </label>

                <div className="compact-task-actions">
                  <button
                    onClick={() => startEdit(task)}
                    aria-label={`Edit ${task.title}`}
                    title="Edit"
                  >
                    ✎
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add Task */}
      {showInput ? (
        <div className="compact-task-add-form">
          <input
            type="text"
            placeholder="Enter your task..."
            value={newTask}
            onChange={(event) => setNewTask(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addTask();

              if (event.key === "Escape") {
                setShowInput(false);
                setNewTask("");
              }
            }}
            autoFocus
          />

          <button onClick={addTask} disabled={!newTask.trim()}>
            Add
          </button>

          <button
            onClick={() => {
              setShowInput(false);
              setNewTask("");
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="compact-add-task-btn"
          onClick={() => setShowInput(true)}
        >
          <span>⊕</span> Add Task
        </button>
      )}

    </section>
  );
}

export default Tasks;
