const { Server } = require("socket.io");
let ioInstance = null;
const onlineUsers = new Map();

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: { origin: "*" },
  });

  ioInstance.on("connection", (socket) => {
    const user = socket.user; // middleware JWT verify sẽ gắn vào
    if (!user) return;

    // Tăng số tab
    const count = onlineUsers.get(user.id) || 0;
    onlineUsers.set(user.id, count + 1);
    ioInstance.emit("presence", { userId: user.id, status: "online", count: count + 1 });

    socket.on("disconnect", () => {
      const current = onlineUsers.get(user.id) || 1;
      if (current <= 1) {
        onlineUsers.delete(user.id);
        ioInstance.emit("presence", { userId: user.id, status: "offline" });
      } else {
        onlineUsers.set(user.id, current - 1);
        ioInstance.emit("presence", { userId: user.id, status: "online", count: current - 1 });
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
