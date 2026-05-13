import envVariables from "../envConfig";

//whishlist, only this origin can have access to our backend
export const whitelist = [envVariables.CLIENT_URL];
