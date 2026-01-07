import express from "express";
import { rm, writeFile } from "fs/promises";
import { Db, ObjectId } from "mongodb";

const router = express.Router();

// get root directory contents
router.get("/", async (req, res) => {
    const { uid } = req.cookies;
    try {
        const db = req.db;
        const directoriesCollection = db.collection("directories");
        const filesCollection = db.collection("files");
        const rootDirectory = await directoriesCollection.findOne({
            parentId: null,
            userId: new ObjectId(uid),
        });
        const files = await filesCollection
            .find({ parentDirId: rootDirectory._id })
            .toArray();
        const directories = await directoriesCollection
            .find({ parentId: rootDirectory._id })
            .toArray();
        res.status(200).json({
            success: true,
            directory: {
                ...rootDirectory,
                content: { files, directories },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// get directory contents
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.db;
        const directoriesCollection = db.collection("directories");
        const filesCollection = db.collection("files");
        const directoryData = await directoriesCollection.findOne({
            _id: new ObjectId(id),
        });
        if (directoryData) {
            const files = await filesCollection
                .find({ parentDirId: new ObjectId(directoryData._id) })
                .toArray();
            const directories = await directoriesCollection
                .find({ parentId: new ObjectId(directoryData._id) })
                .toArray();
            res.status(200).json({
                success: true,
                directory: {
                    ...directoryData,
                    content: {
                        files,
                        directories,
                    },
                },
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Directory not found",
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// create new directory inisde root directory
router.post("/", async (req, res) => {
    const { uid } = req.cookies;
    try {
        const db = req.db;
        const { dirname } = req.headers;
        const directoriesCollection = db.collection("directories");
        const parentDir = await directoriesCollection.findOne({
            parentId: null,
            userId: new ObjectId(uid),
        });
        const parentDirId = parentDir._id.toString();

        const newDir = await directoriesCollection.insertOne({
            name: dirname,
            parentId: new ObjectId(parentDirId),
            userId: new ObjectId(uid),
        });

        res.status(201).json({
            success: true,
            message: "Directory created successfully",
            directory: newDir,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// create new directory inside specified directory
router.post("/:id", async (req, res) => {
    try {
        const { dirname } = req.headers;
        const { id: parentDirId } = req.params;
        const { uid } = req.cookies;
        const db = req.db;
        const directoriesCollection = db.collection("directories");
        const newDirData = await directoriesCollection.insertOne({
            name: dirname,
            parentId: new ObjectId(parentDirId),
            userId: new ObjectId(uid),
        });
        res.status(201).json({
            success: true,
            message: "Directory created successfully",
            directory: newDirData,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// rename directory
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { newdirname } = req.body;
        const db = req.db;
        const directoriesCollection = db.collection("directories");
        const directory = await directoriesCollection.findOne({
            _id: new ObjectId(id),
        });
        if (directory) {
            await directoriesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { name: newdirname } }
            );
            res.status(200).json({
                success: true,
                message: "Directory renamed successfully",
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Directory not found",
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// delete directory

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const { uid } = req.cookies;
    try {
        const db = req.db;
        const directoriesCollection = db.collection("directories");
        const filesCollection = db.collection("files");
        const currentDirObjId = new ObjectId(id);
        const userObjId = new ObjectId(uid);

        async function getDirContent(dirId) {
            let files = await filesCollection
                .find(
                    { parentDirId: dirId, userId: userObjId },
                    { projection: { filename: 1, _id: 1 } }
                )
                .toArray();
            let directories = await directoriesCollection
                .find(
                    { parentId: dirId, userId: userObjId },
                    { projection: { _id: 1 } }
                )
                .toArray();

            for (const directory of directories) {
                const { files: childFiles, directories: childDirs } =
                    await getDirContent(directory._id);
                files = [...files, ...childFiles];
                directories = [...directories, ...childDirs];
            }
            return { files, directories };
        }

        const { files, directories } = await getDirContent(currentDirObjId);

        const filesId = files.map((file) => file._id);
        const directoriesId = [
            ...directories.map((dir) => dir._id),
            currentDirObjId,
        ];
        const filesName = files.map((file) => file.filename);

        for (const filename of filesName) {
            await rm(`./storage//${filename}`);
        }

        await filesCollection.deleteMany({ _id: { $in: filesId } });
        await directoriesCollection.deleteMany({
            _id: { $in: directoriesId },
        });

        res.status(200).json({
            success: true,
            message: "Directory and its content deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;
