import { Response } from "express";

export const getServerError = (res: Response, error: unknown, from: string) => {
  if (error instanceof Error) {
    console.error(`Error occurred at ${from} : `, error);
  }
  return res.status(500).json({ message: "Internal Server Error" });
};
