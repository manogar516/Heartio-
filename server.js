// Import required modules
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server);

// Store groups: { groupName: { passcode: string, users: Set, creator: string } }
const groups = new Map();

// Serve static files from "public" folder
app.use(express.static("public"));

// Handle socket connections
io.on("connection", (socket) => {
  console.log("🟢 A user connected");

  // When a new user joins with a username
  socket.on("new user", (username) => {
    socket.username = username;
    socket.broadcast.emit("system message", `${username} joined the chat.`);
  });

  // Create a new group
  socket.on("create group", ({ groupName, passcode }) => {
    if (groups.has(groupName)) {
      socket.emit("group error", "Group name already exists");
      return;
    }

    groups.set(groupName, {
      passcode,
      users: new Set([socket.id]),
      creator: socket.id
    });
    
    socket.join(groupName);
    socket.emit("group created", groupName);
    console.log(`Group created: ${groupName}`);
  });

  // Join an existing group
  socket.on("join group", ({ groupName, passcode, username }) => {
    if (!groups.has(groupName)) {
      socket.emit("group error", "Group doesn't exist");
      return;
    }

    const group = groups.get(groupName);
    if (group.passcode !== passcode) {
      socket.emit("group error", "Incorrect passcode");
      return;
    }

    socket.join(groupName);
    group.users.add(socket.id);
    socket.username = username;
    socket.emit("group joined", groupName);
    socket.to(groupName).emit("system message", `${username} joined the group.`);
    console.log(`${username} joined group: ${groupName}`);
  });

  // Leave a group
  socket.on("leave group", ({ groupName, username }) => {
    if (groups.has(groupName)) {
      const group = groups.get(groupName);
      group.users.delete(socket.id);
      socket.leave(groupName);
      socket.to(groupName).emit("system message", `${username} left the group.`);
      
      if (group.users.size === 0) {
        groups.delete(groupName);
        console.log(`Group deleted: ${groupName}`);
      }
    }
  });

  // When a user sends a chat message
  socket.on("chat message", (data) => {
    const msg = {
      user: data.user,
      text: data.text,
      time: new Date().toISOString(),
      group: data.group
    };
    io.to(data.group).emit("chat message", msg);
  });

  // Typing notification to others in group
  socket.on("typing", ({ user, group }) => {
    socket.to(group).emit("typing", user);
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    // Leave all groups when disconnecting
    groups.forEach((group, groupName) => {
      if (group.users.has(socket.id)) {
        group.users.delete(socket.id);
        io.to(groupName).emit("system message", 
          `${socket.username || "A user"} left the group.`);
        
        if (group.users.size === 0) {
          groups.delete(groupName);
        }
      }
    });
    
    console.log("🔴 A user disconnected");
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, "localhost", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
