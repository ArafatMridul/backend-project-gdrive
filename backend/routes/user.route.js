import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

router.post("/", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const db = req.db;
        const userCollection = db.collection("users");
        const directoriesCollection = db.collection("directories");
        const userData = await userCollection.findOne({ email });

        if (userData) {
            return res.status(409).json({
                success: false,
                message: "user with same email already exists.",
            });
        }
        const userNew = await userCollection.insertOne({
            name,
            email,
            password,
        });

        const userId = userNew.insertedId;

        const rootDir = await directoriesCollection.insertOne({
            name: `root-${email}`,
            userId,
            parentId: null,
        });
        const rootDirId = rootDir.insertedId;
        console.log(userId);

        await userCollection.updateOne(
            { _id: new ObjectId(String(userId)) },
            { $set: { rootDirId: rootDirId } }
        );
        res.json({ success: true, message: "User created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const db = req.db;
    const userCollection = db.collection("users");
    const userData = await userCollection.findOne({ email, password });
    if (!userData) {
        return res
            .status(404)
            .json({ success: false, message: "Credentials Invalid" });
    }
    res.cookie("uid", userData._id, {
        httpOnly: true,
        maxAge: 60 * 1000 * 60 * 24 * 7,
    });
    res.json({ success: true, message: "Login successful" });
});

router.post("/logout", (req, res) => {
    res.clearCookie("uid", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
    });

    res.json({ success: true, message: "Logged out" });
});

export default router;
