const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let ioInstance = null;
const onlineUsers = new Map();

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: { origin: "*" },
    pingInterval: 20000,
    pingTimeout: 60000,
  });

  ioInstance.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const user = socket.user;
    if (!user) return;

    const userId = user.id || user._id;
    socket.join(userId.toString());
    if (user.role === "admin") socket.join("admins");

    console.log(`${userId} connected via ${socket.id}`);

    // Track online status
    const prevCount = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, prevCount + 1);

    ioInstance.emit("presence", {
      userId,
      status: "online",
      count: prevCount + 1,
    });

    // Rejoin rooms on reconnect
    socket.on("rejoin", () => {
      socket.join(userId.toString());
      if (user.role === "admin") socket.join("admins");
      console.log(`🔁 ${userId} rejoined rooms`);
    });

    socket.on("disconnect", (reason) => {
      const current = onlineUsers.get(userId) || 1;
      if (current <= 1) {
        onlineUsers.delete(userId);
        ioInstance.emit("presence", { userId, status: "offline" });
      } else {
        onlineUsers.set(userId, current - 1);
        ioInstance.emit("presence", { userId, status: "online", count: current - 1 });
      }
      console.log(`🔌 ${userId} disconnected (${reason})`);
    });
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) throw new Error("Socket.io not initialized");
  return ioInstance;
}

function emitToUser(userId, event, data) {
  getIO().to(userId.toString()).emit(event, data);
}

module.exports = { initSocket, getIO, emitToUser, onlineUsers };
