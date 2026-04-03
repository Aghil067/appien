const mongoose = require('mongoose');

const uri = "mongodb+srv://zuddhatechnologies_db_user:TGHPdoKXbS31OJPp@appien.3ppmqr5.mongodb.net/?appName=Appien";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    // Check if index exists and drop it
    const indexes = await collection.indexes();
    const hasPhoneNumberIndex = indexes.find(idx => idx.name === 'phoneNumber_1');
    if (hasPhoneNumberIndex) {
      await collection.dropIndex('phoneNumber_1');
      console.log("Dropped phoneNumber_1 index successfully.");
    } else {
      console.log("phoneNumber_1 index not found.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
