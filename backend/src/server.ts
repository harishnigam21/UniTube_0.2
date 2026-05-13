import http from "http";
import app from "./app";
import { initSocket } from "./socket";
import envVariables from "./envConfig";
import connectDB from "./config/db";
const server = http.createServer(app);

connectDB();
initSocket(server);

const PORT = envVariables.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
