import mongoose from "mongoose";
import dotenv from "dotenv";

// Import all models to ensure they are registered with mongoose
import "./src/models/User.js";
import "./src/models/Pet.js";
import "./src/models/DiaryEntry.js";
import "./src/models/SpaBooking.js";
import "./src/models/SpaService.js";
import "./src/models/CafeItem.js";
import "./src/models/CafeOrder.js";
import "./src/models/Notification.js";

dotenv.config();

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      await mongoose.connection.collections[collectionName].deleteMany({});
      console.log(`Cleared collection: ${collectionName}`);
    }

    console.log("\nDatabase cleared successfully!");
    console.log("NOTE: All users (including admins) have been removed.");
    console.log("Please run 'node createAdmin.js' to create a new administrator account.");
  } catch (error) {
    console.error("Error clearing database:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

clearDB();
