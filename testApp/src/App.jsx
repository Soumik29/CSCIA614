import { useState } from "react";
import { /*db*/ shoppingdata } from "./firebase";
import { addDoc /*getDocs, deleteDoc, doc*/ } from "firebase/firestore";
import "./TaskStyles.css";

function App() {
  const testList = [
    { id: 1, content: "milk", style: "cool" },
    { id: 2, content: "breed", style: "hot" },
    { id: 3, content: "eggs", style: "warm" },
  ];
  const [taskList, setTaskList] = useState(testList);
  const [count, setCount] = useState(0);
  const changeStyle = (id, currentStyle) => {
    let newStyle;
    if (currentStyle === "cool") {
      newStyle = "complete";
    } else if (currentStyle === "complete") {
      newStyle = "hot";
    } else if (currentStyle === "hot") {
      newStyle = "warm";
    } else {
      newStyle = "cool";
    }
    const newlist = taskList.map((task) =>
      task.id === id ? { ...task, style: newStyle } : task,
    );
    setTaskList(newlist);
  };

  const listItems = taskList.map((task) => (
    <li
      key={task.id}
      className={task.style}
      onClick={() => changeStyle(task.id, task.style)}
    >
      {task.content}
    </li>
  ));
  function addTask(event) {
    if (event.key === "Enter") {
      const newTask = { id: count, content: event.target.value, style: "cool" };
      setTaskList([...taskList, newTask]);
      setCount(count + 1);
      event.target.value = "";
    }
  }

  const savedata = async () => {
    try {
      // Save each task to Firestore
      for (const task of taskList) {
        await addDoc(shoppingdata, {
          content: task.content,
          style: task.style,
        });
      }
      alert("Data saved to Firestore!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data");
    }
  };

  function clearList() {
    setTaskList([]);
    setCount(1);
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div>
        <h1>Hello World</h1>
        <ul className="task-list">{listItems}</ul>
        <button className="counter-button" onClick={savedata}>
          Save to Firestore
        </button>
        <input type="text" placeholder="Enter" onKeyDown={addTask} />
        <button onClick={clearList}>Clear List</button>
      </div>
    </div>
  );
}

export default App;
