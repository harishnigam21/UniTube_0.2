import { Server } from "socket.io";

export let io: Server;
export const userSockedIds: Record<string, string> = {};
export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userID = socket.handshake.query.userID as string;
    console.log("User connected:", userID);
    if (userID) {
      userSockedIds[userID] = socket.id;
    }
    io.emit("getOnlineUsers", Object.keys(userSockedIds));

    socket.on("disconnect", () => {
      console.log("User disconnected:", userID);
      io.emit("getOfflineUsers", userID);
      delete userSockedIds[userID];
      io.emit("getOnlineUsers", Object.keys(userSockedIds));
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};
