import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import "./TaskStyles.css";
import { db } from "./firebase";

function nextStyle(style) {
  if (style === "cool") return "complete";
  if (style === "complete") return "hot";
  return "cool";
}

function App() {
  const [taskList, setTaskList] = useState([]);
  const [input, setInput] = useState("");
  const [sortMode, setSortMode] = useState("importance");
  const [createdBy, setCreatedBy] = useState("soumik");

  useEffect(() => {
    const q = query(
      collection(db, "shoppingList"),
      orderBy("createdAt", "asc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Snapshot size:", snapshot.size);
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setTaskList(items);
    });
    return () => unsubscribe();
  }, []);

  const sortedTasks = useMemo(() => {
    const items = [...taskList];

    if (sortMode === "importance") {
      const pr = { hot: 3, cool: 2, complete: 1 };
      items.sort((a, b) => (pr[b.style] ?? 0) - (pr[a.style] ?? 0));
    } else if (sortMode === "time") {
      items.sort((a, b) => {
        const at = a.createdAt?.toMillis?.() ?? 0;
        const bt = b.createdAt?.toMillis?.() ?? 0;
        return at - bt;
      });
    } else if (sortMode === "user") {
      items.sort((a, b) =>
        (a.created_by ?? "").localeCompare(b.created_by ?? ""),
      );
    }
    return items;
  }, [taskList, sortMode]);
  async function addTask(e) {

    // setInput("");
    e.preventDefault();
    const content = input.trim();
    if (!content) return;

    try {
      const ref = await addDoc(collection(db, "shoppingList"), {
        content,
        style: "cool",
        created_by: createdBy,
        createdAt: serverTimestamp(),
      });

      console.log("Added doc id:", ref.id);
      setInput("");
    } catch (err) {
      console.error("ADD FAILED:", err);
      alert(err.message);
    }
  }

  async function changeStyle(task) {
    const newStyle = nextStyle(task.style);

    setTaskList((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, style: newStyle } : t)),
    );

    await updateDoc(doc(db, "shoppingList", task.id), { style: newStyle });
  }

  async function deleteCompleted() {
    const q = query(
      collection(db, "shoppingList"),
      where("style", "==", "complete"),
    );
    const snap = await getDocs(q);

    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async function clearAll() {
    const snap = await getDocs(collection(db, "shoppingList"));
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
      <div style={{ width: 520 }}>
        <h1>Shopping List</h1>

        {/* User field */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder="Your name (created_by)"
            style={{ flex: 1 }}
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
          >
            <option value="importance">Sort: importance</option>
            <option value="time">Sort: time</option>
            <option value="user">Sort: user</option>
          </select>
        </div>

        {/* Add item */}
        <form onSubmit={addTask} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Add item and press Enter"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit">Add</button>
        </form>

        {/* List */}
        <ul className="task-list" style={{ marginTop: 16 }}>
          {sortedTasks.map((task) => (
            <li
              key={task.id}
              className={task.style}
              onClick={() => changeStyle(task)}
              title="Click to cycle: cool → complete → hot → cool"
              style={{ cursor: "pointer" }}
            >
              {task.content}{" "}
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                ({task.created_by ?? "unknown"})
              </span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={deleteCompleted}>Delete Completed</button>
          <button onClick={clearAll}>Clear All</button>
        </div>
      </div>
    </div>
  );
}

export default App;
