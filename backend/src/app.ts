import express from "express";
import cors from "cors";
import corsOptions from "./config/cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(cookieParser());
app.use(cors(corsOptions));

app.use(express.json());

app.get("/", (_, res) => {
  res.send("UiTube API Running..");
});

export default app;
