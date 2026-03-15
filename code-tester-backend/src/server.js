import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import sql from "./database/db.js";


const PORT = process.env.PORT || 5000;
async function startServer() {
  try {
    // Test DB connection
    await sql`SELECT 1`;
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error);
  }
}

startServer();