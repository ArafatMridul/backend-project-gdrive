import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileRoutes from "./routes/file.routes.js";
import directoryRoutes from "./routes/directory.route.js";
import userRoutes from "./routes/user.route.js";
import checkAuth from "./middleware/auth.middleware.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use("/file", checkAuth, fileRoutes);
app.use("/directory", checkAuth, directoryRoutes);
app.use("/user", userRoutes);

app.listen(4000, () => {
    console.log("Server is running on http://localhost:4000");
});
