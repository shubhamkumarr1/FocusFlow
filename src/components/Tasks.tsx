
import { useEffect, useState } from "react";

type TaskPriority = "high" | "medium" | "low";
type TaskFilter = "all" | "active" | "completed" | "high";
type TaskSort =
  | "newest"
  | "oldest"
  | "high-low"
  | "low-high"
  | "alphabetical";
type TaskCategory = "study" | "work" | "personal" | "other";
type CategoryFilter = "all" | TaskCategory;
type TaskRecurrence = "none" | "daily" | "weekly" | "monthly";

type Subtask = {
  id: number;
  title: string;
  completed: boolean;
};

type Task = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate: string;
  category: TaskCategory;
  subtasks: Subtask[];
  recurrence: TaskRecurrence;
};

type Toast = {
  message: string;
  type: "success" | "delete";
};

type DeletedTask = {
  task: Task;
  index: number;
};

type UndoData = {
  tasks: DeletedTask[];
};

const STORAGE_KEY = "focusflow_tasks";

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString: string) {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDeadlineStatus(task: Task) {
  if (task.completed) return "Completed";
  if (!task.dueDate) return "No deadline";

  const today = getTodayDate();

  if (task.dueDate < today) return "Overdue";
  if (task.dueDate === today) return "Due Today";

  return "Upcoming";
}

function getCalendarDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);

      if (savedTasks) {
        const parsedTasks: unknown = JSON.parse(savedTasks);

        if (Array.isArray(parsedTasks)) {
          return parsedTasks.map((task: any) => ({
            ...task,
            priority: ["high", "medium", "low"].includes(task.priority)
              ? task.priority
              : "medium",
            dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
            category: ["study", "work", "personal", "other"].includes(task.category)
              ? task.category
              : "other",
            description:
              typeof task.description === "string" ? task.description : "",
            recurrence: ["none", "daily", "weekly", "monthly"].includes(
              task.recurrence
            )
              ? task.recurrence
              : "none",
            subtasks: Array.isArray(task.subtasks)
              ? task.subtasks
                  .filter(
                    (subtask: any) =>
                      subtask && typeof subtask.title === "string"
                  )
                  .map((subtask: any) => ({
                    id: typeof subtask.id === "number" ? subtask.id : Date.now(),
                    title: subtask.title,
                    completed: Boolean(subtask.completed),
                  }))
              : [],
          })) as Task[];
        }
      }
    } catch (error) {
      console.error("Unable to load tasks:", error);
    }

    return [
      {
        id: 1,
        title: "Study Java for 1 hour",
        description: "",
        completed: false,
        priority: "high",
        dueDate: "",
        category: "study",
        subtasks: [],
        recurrence: "none",
      },
      {
        id: 2,
        title: "Complete DSA questions",
        description: "",
        completed: false,
        priority: "high",
        dueDate: "",
        category: "study",
        subtasks: [],
        recurrence: "none",
      },
      {
        id: 3,
        title: "Practice React",
        description: "",
        completed: false,
        priority: "medium",
        dueDate: "",
        category: "work",
        subtasks: [],
        recurrence: "none",
      },
    ];
  });

  // Toast and Undo
  const [toast, setToast] = useState<Toast | null>(null);
  const [undoData, setUndoData] = useState<UndoData | null>(null);

  // Bulk selection
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  // Add task
  const [newTask, setNewTask] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newCategory, setNewCategory] = useState<TaskCategory>("study");
  const [newRecurrence, setNewRecurrence] =
    useState<TaskRecurrence>("none");

  // Edit task
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editCategory, setEditCategory] = useState<TaskCategory>("study");
  const [editRecurrence, setEditRecurrence] =
    useState<TaskRecurrence>("none");

  // Filters and search
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<TaskSort>("newest");

  // Calendar
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // Subtasks
  const [newSubtaskTaskId, setNewSubtaskTaskId] = useState<number | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtask, setEditingSubtask] = useState<{
    taskId: number;
    subtaskId: number;
  } | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState("");

  // Save tasks
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Remove stale selections
  useEffect(() => {
    const existingIds = new Set(tasks.map((task) => task.id));

    setSelectedTaskIds((previous) =>
      previous.filter((id) => existingIds.has(id))
    );
  }, [tasks]);

  // Hide toast after 5 seconds
  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
      setUndoData(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message: string, type: "success" | "delete") {
    setToast({ message, type });
  }

  // Add task
  function addTask() {
    if (!newTask.trim()) return;

    const task: Task = {
      id: Date.now(),
      title: newTask.trim(),
      description: newDescription.trim(),
      completed: false,
      priority: newPriority,
      dueDate: newDueDate,
      category: newCategory,
      subtasks: [],
      recurrence: newRecurrence,
    };

    setTasks((previous) => [...previous, task]);

    setNewTask("");
    setNewDescription("");
    setNewPriority("medium");
    setNewDueDate("");
    setNewCategory("study");
    setNewRecurrence("none");

    showToast("Task added successfully!", "success");
  }

  // Complete or uncomplete task
  function toggleTask(id: number) {
    const selectedTask = tasks.find((task) => task.id === id);
    if (!selectedTask) return;

    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );

    setUndoData(null);

    showToast(
      selectedTask.completed
        ? "Task marked as active!"
        : "Task completed successfully!",
      "success"
    );
  }

  // Selection
  function toggleSelection(id: number) {
    setSelectedTaskIds((previous) =>
      previous.includes(id)
        ? previous.filter((taskId) => taskId !== id)
        : [...previous, id]
    );
  }

  function toggleSelectAll() {
    const visibleIds = sortedTasks.map((task) => task.id);
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedTaskIds.includes(id));

    if (allSelected) {
      setSelectedTaskIds((previous) =>
        previous.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedTaskIds((previous) =>
        Array.from(new Set([...previous, ...visibleIds]))
      );
    }
  }

  // Bulk complete
  function completeSelectedTasks() {
    if (selectedTaskIds.length === 0) return;

    const selectedCount = selectedTaskIds.length;

    setTasks((previous) =>
      previous.map((task) =>
        selectedTaskIds.includes(task.id)
          ? { ...task, completed: true }
          : task
      )
    );

    setSelectedTaskIds([]);
    setUndoData(null);

    showToast(`${selectedCount} task(s) marked as completed!`, "success");
  }

  // Bulk delete
  function deleteSelectedTasks() {
    if (selectedTaskIds.length === 0) return;

    const selectedCount = selectedTaskIds.length;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCount} selected task(s)?`
    );

    if (!confirmed) return;

    const deletedTasks: DeletedTask[] = tasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => selectedTaskIds.includes(task.id));

    setUndoData({ tasks: deletedTasks });

    setTasks((previous) =>
      previous.filter((task) => !selectedTaskIds.includes(task.id))
    );

    if (editingId !== null && selectedTaskIds.includes(editingId)) {
      cancelEdit();
    }

    if (editingSubtask && selectedTaskIds.includes(editingSubtask.taskId)) {
      cancelEditSubtask();
    }

    setSelectedTaskIds([]);
    setNewSubtaskTaskId(null);
    setNewSubtaskTitle("");

    showToast(`${selectedCount} task(s) deleted!`, "delete");
  }

  // Delete one task
  function deleteTask(id: number) {
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) return;

    const deletedTask = tasks[index];

    setUndoData({
      tasks: [{ task: deletedTask, index }],
    });

    setTasks((previous) => previous.filter((task) => task.id !== id));

    if (editingId === id) cancelEdit();

    if (editingSubtask?.taskId === id) {
      cancelEditSubtask();
    }

    setNewSubtaskTaskId(null);
    setNewSubtaskTitle("");

    showToast(`"${deletedTask.title}" deleted!`, "delete");
  }

  // Undo delete
  function undoDelete() {
    if (!undoData) return;

    setTasks((previous) => {
      const restoredTasks = [...previous];

      const sortedDeletedTasks = [...undoData.tasks].sort(
        (a, b) => a.index - b.index
      );

      sortedDeletedTasks.forEach(({ task, index }) => {
        if (!restoredTasks.some((item) => item.id === task.id)) {
          restoredTasks.splice(
            Math.min(index, restoredTasks.length),
            0,
            task
          );
        }
      });

      return restoredTasks;
    });

    const restoredCount = undoData.tasks.length;
    setUndoData(null);

    showToast(
      restoredCount === 1
        ? "Task restored successfully!"
        : `${restoredCount} tasks restored successfully!`,
      "success"
    );
  }

  // Add subtask
  function addSubtask(taskId: number) {
    if (!newSubtaskTitle.trim()) return;

    const subtask: Subtask = {
      id: Date.now(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: [...(task.subtasks || []), subtask] }
          : task
      )
    );

    setNewSubtaskTitle("");
    setNewSubtaskTaskId(null);
  }

  // Toggle subtask
  function toggleSubtask(taskId: number, subtaskId: number) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: (task.subtasks || []).map((subtask) =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
            }
          : task
      )
    );
  }

  // Delete subtask
  function deleteSubtask(taskId: number, subtaskId: number) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: (task.subtasks || []).filter(
                (subtask) => subtask.id !== subtaskId
              ),
            }
          : task
      )
    );

    if (
      editingSubtask?.taskId === taskId &&
      editingSubtask?.subtaskId === subtaskId
    ) {
      cancelEditSubtask();
    }
  }

  // Edit subtask
  function startEditSubtask(taskId: number, subtask: Subtask) {
    setEditingSubtask({ taskId, subtaskId: subtask.id });
    setEditSubtaskTitle(subtask.title);
  }

  function saveEditSubtask() {
    if (!editingSubtask || !editSubtaskTitle.trim()) return;

    setTasks((previous) =>
      previous.map((task) =>
        task.id === editingSubtask.taskId
          ? {
              ...task,
              subtasks: (task.subtasks || []).map((subtask) =>
                subtask.id === editingSubtask.subtaskId
                  ? { ...subtask, title: editSubtaskTitle.trim() }
                  : subtask
              ),
            }
          : task
      )
    );

    cancelEditSubtask();
  }

  function cancelEditSubtask() {
    setEditingSubtask(null);
    setEditSubtaskTitle("");
  }

  // Edit task
  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate);
    setEditCategory(task.category);
    setEditRecurrence(task.recurrence || "none");
  }

  function saveEdit() {
    if (!editTitle.trim() || editingId === null) return;

    setTasks((previous) =>
      previous.map((task) =>
        task.id === editingId
          ? {
              ...task,
              title: editTitle.trim(),
              description: editDescription.trim(),
              priority: editPriority,
              dueDate: editDueDate,
              category: editCategory,
              recurrence: editRecurrence,
            }
          : task
      )
    );

    cancelEdit();
    showToast("Task updated successfully!", "success");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditPriority("medium");
    setEditDueDate("");
    setEditCategory("study");
    setEditRecurrence("none");
  }

  // Statistics
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = totalTasks - completedCount;

  const completionRate =
    totalTasks === 0
      ? 0
      : Math.round((completedCount / totalTasks) * 100);

  const overdueCount = tasks.filter(
    (task) => getDeadlineStatus(task) === "Overdue"
  ).length;

  const upcomingCount = tasks.filter(
    (task) =>
      getDeadlineStatus(task) === "Upcoming" ||
      getDeadlineStatus(task) === "Due Today"
  ).length;

  // Search and filters
  const filteredTasks = tasks.filter((task) => {
    const searchValue = searchTerm.trim().toLowerCase();

    const matchesSearch =
      task.title.toLowerCase().includes(searchValue) ||
      (task.description || "").toLowerCase().includes(searchValue);

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && !task.completed) ||
      (filter === "completed" && task.completed) ||
      (filter === "high" && task.priority === "high");

    const matchesCategory =
      categoryFilter === "all" || task.category === categoryFilter;

    return matchesSearch && matchesFilter && matchesCategory;
  });

  // Sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };

    switch (sortBy) {
      case "newest":
        return b.id - a.id;
      case "oldest":
        return a.id - b.id;
      case "high-low":
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case "low-high":
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case "alphabetical":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const visibleIds = sortedTasks.map((task) => task.id);

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedTaskIds.includes(id));

  // Calendar
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthName = currentMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDay = (firstDay + 6) % 7;

  const calendarDays: Array<string | null> = [
    ...Array(startingDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      getCalendarDate(new Date(year, month, index + 1))
    ),
  ];

  const selectedDateTasks = tasks.filter(
    (task) => task.dueDate === selectedDate
  );

  function changeMonth(direction: number) {
    setCurrentMonth(new Date(year, month + direction, 1));
  }

  function goToToday() {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(getTodayDate());
  }

  // Category counts
  const categoryCounts = {
    study: tasks.filter((task) => task.category === "study").length,
    work: tasks.filter((task) => task.category === "work").length,
    personal: tasks.filter((task) => task.category === "personal").length,
    other: tasks.filter((task) => task.category === "other").length,
  };

  return (
    <section className="tasks-section">
      {/* Toast */}
      {toast && (
        <div
          className={`task-toast ${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="toast-message">
            {toast.type === "success" ? "✓" : "🗑"} {toast.message}
          </span>

          {toast.type === "delete" && undoData && (
            <button className="undo-btn" onClick={undoDelete}>
              Undo
            </button>
          )}

          <button
            className="toast-close"
            onClick={() => {
              setToast(null);
              setUndoData(null);
            }}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="tasks-header">
        <div>
          <p className="section-label">TASK MANAGER</p>
          <h2>My Tasks</h2>
        </div>
        <span>{completedCount}/{totalTasks} Completed</span>
      </div>

      {/* Statistics */}
      <div className="task-stats">
        <div className="task-stat-card">
          <p>Total Tasks</p>
          <h3>{totalTasks}</h3>
          <span>All your tasks</span>
        </div>
        <div className="task-stat-card">
          <p>Completed</p>
          <h3>{completedCount}</h3>
          <span>Tasks finished</span>
        </div>
        <div className="task-stat-card">
          <p>Pending</p>
          <h3>{activeCount}</h3>
          <span>Tasks remaining</span>
        </div>
        <div className="task-stat-card">
          <p>Completion Rate</p>
          <h3>{completionRate}%</h3>
          <span>Overall progress</span>
        </div>
      </div>

      {/* Deadline Summary */}
      <div className="deadline-summary">
        <div>
          <span>Upcoming / Due Today</span>
          <strong>{upcomingCount}</strong>
        </div>
        <div>
          <span>Overdue Tasks</span>
          <strong>{overdueCount}</strong>
        </div>
      </div>

      {/* Progress */}
      <div className="task-progress">
        <div className="task-progress-header">
          <span>Overall Progress</span>
          <span>{completionRate}%</span>
        </div>
        <div className="task-progress-track">
          <div
            className="task-progress-fill"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Add Task */}
      <div className="task-input">
        <input
          type="text"
          placeholder="Enter your task..."
          value={newTask}
          onChange={(event) => setNewTask(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addTask();
          }}
        />

        <select
          value={newPriority}
          onChange={(event) =>
            setNewPriority(event.target.value as TaskPriority)
          }
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <button onClick={addTask}>+ Add Task</button>
      </div>

      {/* Description */}
      <div className="task-description-form">
        <label htmlFor="new-description">Task Description / Notes:</label>
        <textarea
          id="new-description"
          className="task-description-input"
          placeholder="Write details about your task..."
          value={newDescription}
          onChange={(event) => setNewDescription(event.target.value)}
          rows={3}
        />
      </div>

      {/* Deadline */}
      <div className="task-deadline-input">
        <label htmlFor="new-due-date">Task Deadline:</label>
        <input
          id="new-due-date"
          type="date"
          min={getTodayDate()}
          value={newDueDate}
          onChange={(event) => setNewDueDate(event.target.value)}
        />
      </div>

      {/* Category */}
      <div className="task-category-input">
        <label htmlFor="new-category">Task Category:</label>
        <select
          id="new-category"
          value={newCategory}
          onChange={(event) =>
            setNewCategory(event.target.value as TaskCategory)
          }
        >
          <option value="study">📚 Study</option>
          <option value="work">💼 Work</option>
          <option value="personal">👤 Personal</option>
          <option value="other">📌 Other</option>
        </select>
      </div>

      {/* Lesson 49: Recurrence */}
      <div className="task-category-input">
        <label htmlFor="new-recurrence">Repeat Task:</label>
        <select
          id="new-recurrence"
          value={newRecurrence}
          onChange={(event) =>
            setNewRecurrence(event.target.value as TaskRecurrence)
          }
        >
          <option value="none">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Calendar */}
      <div className="task-calendar">
        <div className="calendar-header">
          <div>
            <p className="section-label">SCHEDULE</p>
            <h2>Task Calendar</h2>
          </div>
          <button onClick={goToToday} className="calendar-today-btn">
            Today
          </button>
        </div>

        <div className="calendar-navigation">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month">
            ←
          </button>
          <h3>{monthName}</h3>
          <button onClick={() => changeMonth(1)} aria-label="Next month">
            →
          </button>
        </div>

        <div className="calendar-grid">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div className="calendar-weekday" key={day}>
              {day}
            </div>
          ))}

          {calendarDays.map((date, index) => {
            if (!date) {
              return (
                <div className="calendar-day empty" key={`empty-${index}`} />
              );
            }

            const dayTasks = tasks.filter((task) => task.dueDate === date);
            const isToday = date === getTodayDate();
            const isSelected = date === selectedDate;

            return (
              <button
                key={date}
                className={[
                  "calendar-day",
                  isToday ? "today" : "",
                  isSelected ? "selected" : "",
                  dayTasks.length > 0 ? "has-tasks" : "",
                ].join(" ")}
                onClick={() => setSelectedDate(date)}
              >
                <span>{Number(date.split("-")[2])}</span>
                {dayTasks.length > 0 && (
                  <span className="calendar-task-count">{dayTasks.length}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="calendar-legend">
          <span><i className="legend-today" /> Today</span>
          <span><i className="legend-task" /> Has tasks</span>
          <span><i className="legend-selected" /> Selected</span>
        </div>

        <div className="calendar-selected-tasks">
          <h3>Tasks for {formatDate(selectedDate)}</h3>
          {selectedDateTasks.length === 0 ? (
            <p>No tasks scheduled for this date.</p>
          ) : (
            selectedDateTasks.map((task) => (
              <div className="calendar-task-item" key={task.id}>
                <span className={task.completed ? "completed" : ""}>
                  {task.title}
                </span>
                <span
                  className={`deadline-badge ${getDeadlineStatus(task)
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {getDeadlineStatus(task)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Search */}
      <div className="task-search">
        <input
          type="text"
          placeholder="Search your tasks or descriptions..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")}>Clear</button>
        )}
      </div>

      {/* Sorting */}
      <div className="task-sorting">
        <label htmlFor="task-sort">Sort By:</label>
        <select
          id="task-sort"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as TaskSort)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="high-low">Priority: High to Low</option>
          <option value="low-high">Priority: Low to High</option>
          <option value="alphabetical">Alphabetical (A-Z)</option>
        </select>
      </div>

      {/* Status Filters */}
      <div className="task-filters">
        <button
          className={filter === "all" ? "filter-btn active" : "filter-btn"}
          onClick={() => setFilter("all")}
        >
          All ({totalTasks})
        </button>
        <button
          className={filter === "active" ? "filter-btn active" : "filter-btn"}
          onClick={() => setFilter("active")}
        >
          Active ({activeCount})
        </button>
        <button
          className={filter === "completed" ? "filter-btn active" : "filter-btn"}
          onClick={() => setFilter("completed")}
        >
          Completed ({completedCount})
        </button>
        <button
          className={filter === "high" ? "filter-btn active" : "filter-btn"}
          onClick={() => setFilter("high")}
        >
          High Priority ({tasks.filter((task) => task.priority === "high").length})
        </button>
      </div>

      {/* Category Filters */}
      <div className="category-filters">
        <h3>Filter by Category</h3>
        <div className="category-filter-buttons">
          <button
            className={categoryFilter === "all" ? "category-filter-btn active" : "category-filter-btn"}
            onClick={() => setCategoryFilter("all")}
          >
            All Categories ({totalTasks})
          </button>
          <button
            className={categoryFilter === "study" ? "category-filter-btn active" : "category-filter-btn"}
            onClick={() => setCategoryFilter("study")}
          >
            📚 Study ({categoryCounts.study})
          </button>
          <button
            className={categoryFilter === "work" ? "category-filter-btn active" : "category-filter-btn"}
            onClick={() => setCategoryFilter("work")}
          >
            💼 Work ({categoryCounts.work})
          </button>
          <button
            className={categoryFilter === "personal" ? "category-filter-btn active" : "category-filter-btn"}
            onClick={() => setCategoryFilter("personal")}
          >
            👤 Personal ({categoryCounts.personal})
          </button>
          <button
            className={categoryFilter === "other" ? "category-filter-btn active" : "category-filter-btn"}
            onClick={() => setCategoryFilter("other")}
          >
            📌 Other ({categoryCounts.other})
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {sortedTasks.length > 0 && (
        <div className="bulk-actions">
          <label className="bulk-select-all">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAll}
            />
            <span>Select All Visible ({sortedTasks.length})</span>
          </label>

          <span className="bulk-selected-count">
            {selectedTaskIds.length} selected
          </span>

          <div className="bulk-action-buttons">
            <button
              className="bulk-complete-btn"
              onClick={completeSelectedTasks}
              disabled={selectedTaskIds.length === 0}
            >
              ✓ Complete Selected
            </button>

            <button
              className="bulk-delete-btn"
              onClick={deleteSelectedTasks}
              disabled={selectedTaskIds.length === 0}
            >
              🗑 Delete Selected
            </button>

            <button
              className="bulk-clear-btn"
              onClick={() => setSelectedTaskIds([])}
              disabled={selectedTaskIds.length === 0}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="task-list">
        {sortedTasks.length === 0 ? (
          <p className="empty-message">
            {searchTerm
              ? "No matching tasks found!"
              : "No tasks found for the selected filters!"}
          </p>
        ) : (
          sortedTasks.map((task) => (
            <div
              className={`task-item ${
                selectedTaskIds.includes(task.id) ? "task-selected" : ""
              }`}
              key={task.id}
            >
              {editingId === task.id ? (
                <div className="task-edit-box">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveEdit();
                      if (event.key === "Escape") cancelEdit();
                    }}
                    autoFocus
                  />

                  <textarea
                    className="task-description-input"
                    placeholder="Edit task description..."
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    rows={3}
                  />

                  <select
                    value={editPriority}
                    onChange={(event) =>
                      setEditPriority(event.target.value as TaskPriority)
                    }
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(event) => setEditDueDate(event.target.value)}
                  />

                  <select
                    value={editCategory}
                    onChange={(event) =>
                      setEditCategory(event.target.value as TaskCategory)
                    }
                  >
                    <option value="study">Study</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                  </select>

                  {/* Edit recurrence */}
                  <label>Repeat Task:</label>
                  <select
                    value={editRecurrence}
                    onChange={(event) =>
                      setEditRecurrence(event.target.value as TaskRecurrence)
                    }
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>

                  <button
                    className="save-btn"
                    onClick={saveEdit}
                    disabled={!editTitle.trim()}
                  >
                    Save
                  </button>
                  <button className="cancel-btn" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="task-main-content">
                    {/* Individual bulk selection */}
                    <label className="bulk-task-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => toggleSelection(task.id)}
                        aria-label={`Select ${task.title}`}
                      />
                    </label>

                    <label className="task-label">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                      />
                      <span className={task.completed ? "completed" : ""}>
                        {task.title}
                      </span>
                    </label>

                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}

                    {/* Subtasks */}
                    <div className="task-subtasks">
                      <div className="task-subtasks-header">
                        <strong>Subtasks</strong>
                        <span>
                          {(task.subtasks || []).filter((subtask) => subtask.completed).length}/
                          {(task.subtasks || []).length} completed
                        </span>
                      </div>

                      {(task.subtasks || []).length > 0 && (
                        <div className="subtask-progress-track">
                          <div
                            className="subtask-progress-fill"
                            style={{
                              width: `${
                                ((task.subtasks || []).filter(
                                  (subtask) => subtask.completed
                                ).length /
                                  (task.subtasks || []).length) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      )}

                      {(task.subtasks || []).map((subtask) => (
                        <div className="subtask-item" key={subtask.id}>
                          {editingSubtask?.taskId === task.id &&
                          editingSubtask?.subtaskId === subtask.id ? (
                            <div className="subtask-edit-row">
                              <input
                                type="text"
                                value={editSubtaskTitle}
                                onChange={(event) =>
                                  setEditSubtaskTitle(event.target.value)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") saveEditSubtask();
                                  if (event.key === "Escape") cancelEditSubtask();
                                }}
                                autoFocus
                              />
                              <button
                                className="save-btn"
                                onClick={saveEditSubtask}
                                disabled={!editSubtaskTitle.trim()}
                              >
                                Save
                              </button>
                              <button
                                className="cancel-btn"
                                onClick={cancelEditSubtask}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <label className="subtask-label">
                                <input
                                  type="checkbox"
                                  checked={subtask.completed}
                                  onChange={() =>
                                    toggleSubtask(task.id, subtask.id)
                                  }
                                />
                                <span className={subtask.completed ? "completed" : ""}>
                                  {subtask.title}
                                </span>
                              </label>

                              <div className="subtask-actions">
                                <button
                                  className="edit-btn"
                                  onClick={() => startEditSubtask(task.id, subtask)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => deleteSubtask(task.id, subtask.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {newSubtaskTaskId === task.id ? (
                        <div className="subtask-add-row">
                          <input
                            type="text"
                            placeholder="Enter subtask..."
                            value={newSubtaskTitle}
                            onChange={(event) => setNewSubtaskTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") addSubtask(task.id);
                              if (event.key === "Escape") {
                                setNewSubtaskTaskId(null);
                                setNewSubtaskTitle("");
                              }
                            }}
                            autoFocus
                          />
                          <button
                            className="save-btn"
                            onClick={() => addSubtask(task.id)}
                            disabled={!newSubtaskTitle.trim()}
                          >
                            Add
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={() => {
                              setNewSubtaskTaskId(null);
                              setNewSubtaskTitle("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="add-subtask-btn"
                          onClick={() => {
                            setNewSubtaskTaskId(task.id);
                            setNewSubtaskTitle("");
                          }}
                        >
                          + Add Subtask
                        </button>
                      )}
                    </div>

                    <div className="task-extra-info">
                      <span className={`category-badge ${task.category}`}>
                        {task.category.toUpperCase()}
                      </span>

                      {task.recurrence !== "none" && (
                        <span className="category-badge">
                          ↻ {task.recurrence.toUpperCase()}
                        </span>
                      )}

                      {task.dueDate && (
                        <div className="task-deadline-info">
                          <span>Deadline: {formatDate(task.dueDate)}</span>
                          <span
                            className={`deadline-badge ${getDeadlineStatus(task)
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {getDeadlineStatus(task)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="task-buttons">
                    <span className={`priority-badge ${task.priority}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    <button className="edit-btn" onClick={() => startEdit(task)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => deleteTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Tasks;
