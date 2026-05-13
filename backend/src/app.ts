import express from "express";
import cors from "cors";
import corsOptions from "./config/cors";
import cookieParser from "cookie-parser";
import credentials from "./middlewares/credentials";
const app = express();

//App level middlewares
app.use("/uploads", express.static("uploads")); //make upload folder static
app.use(credentials);//checking origin
app.use(express.json()); //parsing data and make fully used data available in body
app.use(express.urlencoded({ extended: true })); //parses incoming requests with URL-encoded payloads
app.use(cookieParser()); //parse the cookies that are attached to the request 
app.use(cors(corsOptions)); //enable CORS with various options

app.use(express.json());

app.get("/", (_, res) => {
  res.send("UiTube API Running..");
});

export default app;
