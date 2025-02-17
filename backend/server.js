const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow frontend to connect
    methods: ["GET", "POST"],
  },
});

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store whiteboard data
let whiteboardData = [];

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Send existing whiteboard data to the new user
  socket.emit("whiteboard-data", whiteboardData);

  // Handle drawing events
  socket.on("draw", (data) => {
    whiteboardData.push(data); // Add new drawing to the data
    socket.broadcast.emit("draw", data); // Broadcast to other users
  });

  // Handle AI summarization request
  socket.on("summarize", async (text) => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: `Summarize this: ${text}` }],
      });
      const summary = response.choices[0].message.content;
      socket.emit("summary", summary); // Send summary back to the user
    } catch (error) {
      console.error("Error summarizing:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});