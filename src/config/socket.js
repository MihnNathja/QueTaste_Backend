// src/config/socket.js
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let ioInstance = null;
const onlineUsers = new Map(); // { userId -> connectionCount }

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: { origin: "*" },
  });

  //  Middleware xác thực token  
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

  //   Khi user kết nối  
  ioInstance.on("connection", (socket) => {
    const user = socket.user;
    if (!user) return;

    // join room theo userId
    socket.join(user.id.toString());

    // nếu role là admin → join room "admins"
    if (user.role === "admin") socket.join("admins");

    // cập nhật trạng thái online
    const prevCount = onlineUsers.get(user.id) || 0;
    onlineUsers.set(user.id, prevCount + 1);

    ioInstance.emit("presence", {
      userId: user.id,
      status: "online",
      count: prevCount + 1,
    });

    //   Khi user ngắt kết nối  
    socket.on("disconnect", () => {
      const current = onlineUsers.get(user.id) || 1;
      if (current <= 1) {
        onlineUsers.delete(user.id);
        ioInstance.emit("presence", {
          userId: user.id,
          status: "offline",
        });
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

//   Hàm lấy instance để emit ở service khác  
function getIO() {
  if (!ioInstance) throw new Error("Socket.io not initialized");
  return ioInstance;
}

//   Emit helper  
function emitToUser(userId, event, data) {
  if (!ioInstance) return;
  ioInstance.to(userId.toString()).emit(event, data);
}

function emitToAdmins(event, data) {
  if (!ioInstance) return;
  ioInstance.to("admins").emit(event, data);
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToAdmins,
  onlineUsers,
};
