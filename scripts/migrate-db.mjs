import { connectDatabase, migrateDatabase } from "./lib/database.mjs";
const db = await connectDatabase();
try { await migrateDatabase(db); console.log("Database migration complete; existing records retained."); }
finally { await db.end(); }
