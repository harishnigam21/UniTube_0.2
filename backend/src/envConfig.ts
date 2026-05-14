import dotenv from "dotenv";
dotenv.config();
const envVariables = {
  PORT: process.env.PORT,
  MAX_CHANNEL: process.env.MAX_CHANNEL,
  CLIENT_URL: process.env.CLIENT_URL,
  ACCESS_TOKEN_KEY: process.env.ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY: process.env.REFRESH_TOKEN_KEY,
  DB_STRING: process.env.DB_STRING,
};
export default envVariables;
