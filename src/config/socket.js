const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const onlineUsers = new Map();

let ioInstance = null;

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: { origin: "*" },
  });

  ioInstance.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("No token"));
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

    socket.join(user.id.toString());

    const count = onlineUsers.get(user.id) || 0;
    onlineUsers.set(user.id, count + 1);
    ioInstance.emit("presence", {
      userId: user.id,
      status: "online",
      count: count + 1,
    });

    socket.on("disconnect", () => {
      const current = onlineUsers.get(user.id) || 1;
      if (current <= 1) {
        onlineUsers.delete(user.id);
        ioInstance.emit("presence", { userId: user.id, status: "offline" });
      } else {
        onlineUsers.set(user.id, current - 1);
        ioInstance.emit("presence", {
          userId: user.id,
          status: "online",
          count: current - 1,
        });
      }
    });
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) throw new Error("Socket.io not initialized");
  return ioInstance;
}

module.exports = { initSocket, getIO, onlineUsers };
