// cor file that will be checking that req origin exist in our whishlist or not
import { whitelist } from "./whitelist.js";
import { CorsOptions } from "cors";
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};

export default corsOptions;
