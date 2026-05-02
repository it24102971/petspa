import mongoose from "mongoose";
import dotenv from "dotenv";
import MenuItem from "./src/models/MenuItem.js";

dotenv.config();

const seedCafeMenu = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const items = [
      { name: "Puppy Latte", price: 4.50, emoji: "☕", category: "drink", isAvailable: true },
      { name: "Kitty Cupcake", price: 3.50, emoji: "🧁", category: "dessert", isAvailable: true },
      { name: "Paw Cookie", price: 2.00, emoji: "🐾", category: "dessert", isAvailable: true },
      { name: "Berry Bow Tart", price: 4.00, emoji: "🎀", category: "dessert", isAvailable: true },
      { name: "Rainbow Shake", price: 5.50, emoji: "🌈", category: "drink", isAvailable: true },
      { name: "Marshmallow Cloud", price: 3.00, emoji: "☁️", category: "dessert", isAvailable: true }
    ];

    for (const item of items) {
      const existing = await MenuItem.findOne({ name: item.name });
      if (!existing) {
        await new MenuItem(item).save();
        console.log(`Added: ${item.name}`);
      } else {
        console.log(`Already exists: ${item.name}`);
      }
    }

    console.log("Cafe menu seeding completed.");
  } catch (error) {
    console.error("Error seeding cafe menu:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedCafeMenu();
