import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });