const { Server } = require("socket.io");
let ioInstance = null;

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: { origin: "*" },
  });
  return ioInstance;
}

function getIO() {
    if (!ioInstance) throw new Error("Socket.io not initialized");
    return ioInstance;
}

module.exports = { initSocket, getIO };
