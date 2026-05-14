import fs from "fs";

export const safeUnlink = (filePath: string | null | undefined): void => {
  if (!filePath) return;

  // Checks if the file path actually exists on your storage drive before deleting
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err)
        console.error(`Failed to delete temporary file at ${filePath}:`, err);
    });
  }
};
