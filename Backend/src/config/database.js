const mongoose = require("mongoose");

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to Database");
  } catch (err) {
    console.error("Database Connection Error:", err.message);
    console.error("Please ensure MongoDB is running at:", process.env.MONGODB_URI);
  }
}

module.exports = connectToDB;
