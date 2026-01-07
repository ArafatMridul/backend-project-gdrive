import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017");

export const connectDB = async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB...");
        const db = client.db("storageApp");
        return db;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

process.on("SIGINT", async () => {
    await client.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
});
