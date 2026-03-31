import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import "./TaskStyles.css";
import { auth, googleProvider } from "./firebase";

function nextStyle(style) {
  if (style === "cool") return "complete";
  if (style === "complete") return "hot";
  return "cool";
}

async function requestJson(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function App() {
  const [taskList, setTaskList] = useState([]);
  const [input, setInput] = useState("");
  const [sortMode, setSortMode] = useState("importance");
  const [createdBy, setCreatedBy] = useState("soumik");
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const isSignedIn = Boolean(user);
  const displayName = user?.displayName || user?.email || "Unknown user";
  const createdByValue = isSignedIn ? displayName : createdBy;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthError("");
      setRequestError("");
      setAuthReady(true);

      if (nextUser) {
        const name = nextUser.displayName || nextUser.email || "Unknown user";
        setCreatedBy(name);
      } else {
        setCreatedBy("");
        setTaskList([]);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadTasks() {
    setIsLoadingList(true);

    try {
      const data = await requestJson("/api/listItems");
      setTaskList(data.items ?? []);
      setRequestError("");
    } catch (err) {
      console.error("LOAD FAILED:", err);
      setRequestError(err.message || "Unable to load items.");
      setTaskList([]);
    } finally {
      setIsLoadingList(false);
    }
  }

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function syncTasks() {
      setIsLoadingList(true);

      try {
        const data = await requestJson("/api/listItems");
        if (cancelled) {
          return;
        }

        setTaskList(data.items ?? []);
        setRequestError("");
      } catch (err) {
        console.error("LOAD FAILED:", err);
        if (cancelled) {
          return;
        }

        setRequestError(err.message || "Unable to load items.");
        setTaskList([]);
      } finally {
        if (!cancelled) {
          setIsLoadingList(false);
        }
      }
    }

    syncTasks();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const sortedTasks = useMemo(() => {
    const items = [...taskList];

    if (sortMode === "importance") {
      const priority = { hot: 3, cool: 2, complete: 1 };
      items.sort((a, b) => (priority[b.style] ?? 0) - (priority[a.style] ?? 0));
    } else if (sortMode === "time") {
      items.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    } else if (sortMode === "user") {
      items.sort((a, b) =>
        (a.created_by ?? "").localeCompare(b.created_by ?? ""),
      );
    }

    return items;
  }, [taskList, sortMode]);

  async function runMutation(work) {
    setIsMutating(true);

    try {
      await work();
      await loadTasks();
      setRequestError("");
    } catch (err) {
      console.error("REQUEST FAILED:", err);
      setRequestError(err.message || "Unable to complete request.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleLogin() {
    setAuthError("");

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(err?.message || "Sign in failed");
    }
  }

  async function handleLogout() {
    setAuthError("");

    try {
      await signOut(auth);
    } catch (err) {
      setAuthError(err?.message || "Sign out failed");
    }
  }

  async function addTask(e) {
    e.preventDefault();

    const content = input.trim();
    if (!content) return;

    const author = createdByValue.trim() || "anonymous";

    await runMutation(async () => {
      await requestJson("/api/addItem", {
        method: "POST",
        body: JSON.stringify({
          content,
          createdBy: author,
        }),
      });

      setInput("");
    });
  }

  async function changeStyle(task) {
    const newStyle = nextStyle(task.style);

    await runMutation(async () => {
      await requestJson("/api/updateItemStyle", {
        method: "POST",
        body: JSON.stringify({
          id: task.id,
          style: newStyle,
        }),
      });
    });
  }

  async function deleteCompleted() {
    await runMutation(async () => {
      await requestJson("/api/deleteCompleted", {
        method: "POST",
      });
    });
  }

  async function clearAll() {
    await runMutation(async () => {
      await requestJson("/api/clearList", {
        method: "POST",
      });
    });
  }

  if (!authReady) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>
        <div style={{ width: 420 }}>
          <h1>Shopping List</h1>
          <div style={{ marginTop: 8, opacity: 0.7 }}>Checking sign-in...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>
        <div style={{ width: 420 }}>
          <h1>Shopping List</h1>
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            Please sign in with Google to continue.
          </div>
          <button onClick={handleLogin}>Sign in with Google</button>
          {authError ? (
            <div style={{ color: "crimson", marginTop: 12 }}>{authError}</div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
      <div style={{ width: 520 }}>
        <h1>Shopping List</h1>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>Account</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {isSignedIn ? `Signed in as ${displayName}` : "Not signed in"}
            </div>
          </div>
          {isSignedIn ? (
            <button onClick={handleLogout}>Sign out</button>
          ) : (
            <button onClick={handleLogin}>Sign in with Google</button>
          )}
        </div>

        {authError ? (
          <div style={{ color: "crimson", marginBottom: 8 }}>{authError}</div>
        ) : null}

        {requestError ? (
          <div style={{ color: "crimson", marginBottom: 8 }}>{requestError}</div>
        ) : null}

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={createdByValue}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder={
              isSignedIn ? "Signed in with Google" : "Your name (created_by)"
            }
            disabled={isSignedIn}
            style={{ flex: 1 }}
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            disabled={isLoadingList || isMutating}
          >
            <option value="importance">Sort: importance</option>
            <option value="time">Sort: time</option>
            <option value="user">Sort: user</option>
          </select>
        </div>

        <form onSubmit={addTask} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Add item and press Enter"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1 }}
            disabled={isMutating}
          />
          <button type="submit" disabled={isMutating}>
            Add
          </button>
        </form>

        {isLoadingList ? (
          <div style={{ marginTop: 16, opacity: 0.7 }}>Loading items...</div>
        ) : null}

        <ul className="task-list" style={{ marginTop: 16 }}>
          {sortedTasks.map((task) => (
            <li
              key={task.id}
              className={task.style}
              onClick={() => changeStyle(task)}
              title="Click to cycle: cool -> complete -> hot -> cool"
              style={{
                cursor: isMutating ? "wait" : "pointer",
                opacity: isMutating ? 0.8 : 1,
              }}
            >
              {task.content}{" "}
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                ({task.created_by ?? "unknown"})
              </span>
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={deleteCompleted} disabled={isMutating}>
            Delete Completed
          </button>
          <button onClick={clearAll} disabled={isMutating}>
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
