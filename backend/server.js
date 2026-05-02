import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";


// DNS Configuration
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });