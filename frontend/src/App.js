import React, { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from 'fabric';
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const canvasRef = useRef(null);
  const [summary, setSummary] = useState("");
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
    });

    const handleWhiteboardData = (data) => {
      data.forEach((item) => {
        canvas.add(item);
      });
    };

    const handleDraw = (data) => {
      canvas.add(data);
    };

    const handlePathCreated = (e) => {
      const path = e.path;
      setHistory([...history, path]);
      setRedoStack([]);
      socket.emit("draw", path);
    };

    socket.on("whiteboard-data", handleWhiteboardData);
    socket.on("draw", handleDraw);
    canvas.on("path:created", handlePathCreated);

    return () => {
      socket.off("whiteboard-data", handleWhiteboardData);
      socket.off("draw", handleDraw);
      canvas.off("path:created", handlePathCreated);
      canvas.dispose();
    };
  }, [history, redoStack]);

  useEffect(() => {
    const handleSummary = (summary) => {
      setSummary(summary);
    };

    socket.on("summary", handleSummary);

    return () => {
      socket.off("summary", handleSummary);
    };
  }, []);

  const handleSummarize = useCallback(() => {
    const text = prompt("Enter text to summarize:");
    if (text) {
      socket.emit("summarize", text);
    }
  }, []);

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const lastAction = history.pop();
    if (lastAction) {
      setRedoStack([...redoStack, lastAction]);
      canvas.remove(lastAction);
    }
  };

  const handleRedo = () => {
    const canvas = canvasRef.current;
    const lastUndo = redoStack.pop();
    if (lastUndo) {
      setHistory([...history, lastUndo]);
      canvas.add(lastUndo);
    }
  };

  return (
    <div className="App">
      <h1>Collaborative Whiteboard</h1>
      <canvas ref={canvasRef} width={800} height={600} />
      <button onClick={handleSummarize}>Summarize Text</button>
      <button onClick={handleUndo}>Undo</button>
      <button onClick={handleRedo}>Redo</button>
      {summary && <div className="summary">{summary}</div>}
    </div>
  );
}

export default App;