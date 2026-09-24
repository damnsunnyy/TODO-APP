import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "/api/todos/";

async function request(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    let detail = "Something went wrong. Please try again.";
    try {
      const body = await response.json();
      detail = body.title?.[0] || body.detail || detail;
    } catch {
      // Some successful responses, such as DELETE, have no JSON body.
    }
    throw new Error(detail);
  }
  return response.status === 204 ? null : response.json();
}

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function fetchTodos() {
    try {
      setError("");
      const data = await request(API_URL);
      setTodos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTodos();
  }, []);

  async function addTodo(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const todo = await request(API_URL, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), completed: false }),
      });
      setTodos((current) => [todo, ...current]);
      setTitle("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleTodo(todo) {
    setError("");
    try {
      const updated = await request(`${API_URL}${todo.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !todo.completed }),
      });
      setTodos((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTodo(id) {
    setError("");
    try {
      await request(`${API_URL}${id}/`, { method: "DELETE" });
      setTodos((current) => current.filter((todo) => todo.id !== id));
      if (editingId === id) cancelEditing();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditing(todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
  }

  async function saveTodo(event, id) {
    event.preventDefault();
    if (!editingTitle.trim()) return;
    setError("");
    try {
      const updated = await request(`${API_URL}${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ title: editingTitle.trim() }),
      });
      setTodos((current) => current.map((todo) => todo.id === updated.id ? updated : todo));
      cancelEditing();
    } catch (err) {
      setError(err.message);
    }
  }

  const completedCount = todos.filter((todo) => todo.completed).length;
  const visibleTodos = useMemo(() => todos.filter((todo) => {
    const matchesFilter = filter === "all" || (filter === "completed" ? todo.completed : !todo.completed);
    return matchesFilter && todo.title.toLowerCase().includes(search.trim().toLowerCase());
  }), [todos, filter, search]);

  async function clearCompleted() {
    const completed = todos.filter((todo) => todo.completed);
    for (const todo of completed) await deleteTodo(todo.id);
  }

  return (
    <main className="page-shell">
      <section className="todo-card" aria-labelledby="page-title">
        <header className="app-header">
          <div className="brand-mark" aria-hidden="true">✓</div>
          <div>
            <p className="eyebrow">A little more focus, every day</p>
            <h1 id="page-title">My Todo List</h1>
            <p className="subtitle">Plan your day, one task at a time.</p>
          </div>
        </header>

        <form className="add-form" onSubmit={addTodo}>
          <label className="sr-only" htmlFor="new-todo">New task</label>
          <input id="new-todo" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to get done?" maxLength={200} />
          <button className="primary-button" type="submit" disabled={saving || !title.trim()}>{saving ? "Adding…" : "Add task"}</button>
        </form>

        {error && <div className="error-banner" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}

        <div className="overview">
          <div><span className="overview-number">{todos.length}</span><span className="overview-label">Total tasks</span></div>
          <div><span className="overview-number">{todos.length - completedCount}</span><span className="overview-label">To do</span></div>
          <div><span className="overview-number">{completedCount}</span><span className="overview-label">Completed</span></div>
        </div>

        <div className="list-toolbar">
          <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
            {["all", "pending", "completed"].map((value) => <button key={value} role="tab" aria-selected={filter === value} className={filter === value ? "filter-tab active" : "filter-tab"} onClick={() => setFilter(value)} type="button">{value[0].toUpperCase() + value.slice(1)}</button>)}
          </div>
          <label className="search-box"><span aria-hidden="true">⌕</span><span className="sr-only">Search tasks</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" /></label>
        </div>

        <div className="todo-list" aria-live="polite">
          {loading ? <div className="empty-state"><span className="loader" />Loading your tasks…</div> : visibleTodos.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">✦</span><strong>{todos.length === 0 ? "Your list is clear" : "No tasks found"}</strong><span>{todos.length === 0 ? "Add a task above and make today count." : "Try another filter or search."}</span></div>
          ) : visibleTodos.map((todo) => (
            <article className={todo.completed ? "todo-row is-complete" : "todo-row"} key={todo.id}>
              {editingId === todo.id ? (
                <form className="edit-form" onSubmit={(event) => saveTodo(event, todo.id)}>
                  <input autoFocus value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} aria-label="Edit task title" maxLength={200} />
                  <button className="icon-button save-button" type="submit" aria-label="Save task">✓</button>
                  <button className="icon-button" type="button" onClick={cancelEditing} aria-label="Cancel editing">×</button>
                </form>
              ) : (
                <>
                  <button className="check-button" type="button" onClick={() => toggleTodo(todo)} aria-label={todo.completed ? "Mark as pending" : "Mark as completed"}>{todo.completed ? "✓" : ""}</button>
                  <div className="task-content"><span className="task-title">{todo.title}</span><time dateTime={todo.created_at}>{new Date(todo.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></div>
                  <div className="row-actions"><button className="icon-button" type="button" onClick={() => startEditing(todo)} aria-label={`Edit ${todo.title}`}>✎</button><button className="icon-button delete-button" type="button" onClick={() => deleteTodo(todo.id)} aria-label={`Delete ${todo.title}`}>×</button></div>
                </>
              )}
            </article>
          ))}
        </div>

        <footer className="list-footer"><span>{todos.length - completedCount} {todos.length - completedCount === 1 ? "task" : "tasks"} remaining</span>{completedCount > 0 && <button className="text-button" type="button" onClick={clearCompleted}>Clear completed</button>}</footer>
      </section>
      <p className="credit">Built with React, Django REST Framework &amp; SQLite</p>
    </main>
  );
}

export default App;
