import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataRoot = path.resolve(__dirname, "../../data");

const ensureFile = async (filePath) => {
  try {
    await fs.access(filePath);
  } catch (err) {
    if (err.code === "ENOENT") {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, "[]");
    } else {
      throw err;
    }
  }
};

export const db = {
  async read(collection) {
    const filePath = path.join(dataRoot, `${collection}.json`);
    await ensureFile(filePath);
    const raw = await fs.readFile(filePath, "utf-8");
    return raw ? JSON.parse(raw) : [];
  },
  async write(collection, data) {
    const filePath = path.join(dataRoot, `${collection}.json`);
    await ensureFile(filePath);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  },
};
