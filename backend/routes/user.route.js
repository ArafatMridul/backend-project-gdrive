import express from "express";
import userDB from "../userDB.json" with { type: "json" };
import directoryDB from "../directoryDB.json" with { type: "json" };
import { writeFile } from "fs/promises";

const router = express.Router();

router.post("/", async (req, res) => {
    const { name, email, password } = req.body;
    const userData = userDB.find((user) => user.email === email);

    if (userData) {
        return res.status(409).json({
            success: false,
            message: "user with same email already exists.",
        });
    }

    const userId = crypto.randomUUID();
    const rootDirId = crypto.randomUUID();

    userDB.push({
        name,
        email,
        password,
        id: userId,
        rootDirId,
    });

    directoryDB.push({
        name: `root-${email}`,
        id: rootDirId,
        userId,
        parentId: null,
        content: {
            files: [],
            directories: [],
        },
    });

    try {
        await writeFile(
            "./directoryDB.json",
            JSON.stringify(directoryDB, null, 4)
        );
        await writeFile("./userDB.json", JSON.stringify(userDB, null, 4));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
    res.json({ success: true, users: userDB, directories: directoryDB });
});

router.post("/login", (req, res) => {
    const { email, password } = req.body;
    const userData = userDB.find((user) => user.email === email);
    if (!userData || userData.password !== password) {
        return res
            .status(404)
            .json({ success: false, message: "Credentials Invalid" });
    }
    res.cookie("uid", userData.id, {
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
