import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in your .env file");
    }
    const conn = await mongoose.connect(uri, {
        serverApi: {
            version: "1",
            strict: false,
            deprecationErrors: true
        },
    });
    
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[db] Connection error: ${err.message}`);
    process.exit(1);
  }
};
