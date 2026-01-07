import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import directoryRoutes from "./routes/directory.route.js";
import fileRoutes from "./routes/file.route.js";
import userRoutes from "./routes/user.route.js";
import checkAuth from "./middleware/auth.middleware.js";
import { connectDB } from "./db/mongodb.js";

const db = await connectDB();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use((req, res, next) => {
    req.db = db;
    next();
});
app.use("/file", checkAuth, fileRoutes);
app.use("/directory", checkAuth, directoryRoutes);
app.use("/user", userRoutes);

app.listen(4000, () => {
    console.log("Server is running on http://localhost:4000");
});
