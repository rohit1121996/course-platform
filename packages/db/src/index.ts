export * from "drizzle-orm";
export * from "./schema";

import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

import path from "path";
import * as schema from "./schema";

const dbPath = path.join(__dirname, '..', 'sqlite.db');
const sqlite = new Database(dbPath);
sqlite.run("PRAGMA foreign_keys = ON;");
export const db = drizzle(sqlite, { schema });
