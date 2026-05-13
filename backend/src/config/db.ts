//mongoose package, this will help us to interact with our mongo DB
import mongoose from "mongoose";
import envVariables from "../envConfig";
const connectDB = async () => {
  try {
    console.log("mongoose is connecting ....");
    //connecting with our DB with the help of connection string
    await mongoose.connect(envVariables.DB_STRING as string, {
      serverSelectionTimeoutMS: 5000, // setting timeout so that it does not lead to finite timeout.
    });
    // this gives the info of our DB in object and after getting this we can handle DB error and other thing
    const db = mongoose.connection;
    //on error
    db.on("error", () => {
      console.error("mongoose failed to connect");
      return;
    });
    //otherwise
    console.log("mongoose got connected successfully.");
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Caught an error while connecting mongoose,",
        error.message,
      );
    }
  }
};
export default connectDB;
