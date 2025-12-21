import express from "express";
import fileRoutes from "./routes/file.routes.js";
import directoryRoutes from "./routes/directory.route.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/file", fileRoutes);
app.use("/directory", directoryRoutes);

app.listen(4000, () => {
    console.log("Server is running on http://localhost:4000");
});
