import express from "express";
import { rm, writeFile } from "fs/promises";
import directoryDB from "../directoryDB.json" with { type: "json" };
import filesDB from "../filesDB.json" with { type: "json" };

const router = express.Router();

// get root directory contents
router.get("/", async (req, res) => {
    const { uid } = req.cookies;
    try {
        const rootDirectory = directoryDB.find(
            (dir) => dir.parentId === null && dir.userId === uid
        );
        const files = rootDirectory.content.files.map((fileId) =>
            filesDB.find((file) => file.id === fileId)
        );
        const directories = rootDirectory.content.directories.map((dirId) =>
            directoryDB.find((dir) => dir.id === dirId)
        );
        res.status(200).json({
            success: true,
            directory: {
                ...rootDirectory,
                content: { ...rootDirectory.content, files, directories },
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
        const directoryData = directoryDB.find((dir) => dir.id === id);
        if (directoryData) {
            const files = directoryData.content.files.map((fileId) =>
                filesDB.find((file) => file.id === fileId)
            );
            const directories = directoryData.content.directories.map((dirId) =>
                directoryDB.find((dir) => dir.id === dirId)
            );
            res.status(200).json({
                success: true,
                directory: {
                    ...directoryData,
                    content: {
                        ...directoryData.content,
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
    // console.log(uid)
    try {
        const { dirname } = req.headers;
        const parentDirId = directoryDB.find(
            (dir) => dir.parentId === null && dir.userId === uid
        ).id;
        const id = crypto.randomUUID();
        directoryDB.push({
            id,
            name: dirname,
            parentId: parentDirId,
            content: { files: [], directories: [] },
        });
        const parentDirData = directoryDB.find((dir) => dir.id === parentDirId);
        parentDirData.content.directories.push(id);
        await writeFile(
            "./directoryDB.json",
            JSON.stringify(directoryDB, null, 2)
        );
        res.status(201).json({
            success: true,
            message: "Directory created successfully",
            directory: {
                id,
                name: dirname,
                parentId: parentDirId,
                content: { files: [], directories: [] },
            },
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
        const id = crypto.randomUUID();
        directoryDB.push({
            id,
            name: dirname,
            parentId: parentDirId,
            content: { files: [], directories: [] },
        });
        const parentDirData = directoryDB.find((dir) => dir.id === parentDirId);
        parentDirData.content.directories.push(id);
        await writeFile(
            "./directoryDB.json",
            JSON.stringify(directoryDB, null, 2)
        );
        res.status(201).json({
            success: true,
            message: "Directory created successfully",
            directory: {
                id,
                name: dirname,
                parentId: parentDirId,
                content: { files: [], directories: [] },
            },
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
        const directory = directoryDB.find((dir) => dir.id === id);
        if (directory) {
            directory.name = newdirname;
            await writeFile(
                "./directoryDB.json",
                JSON.stringify(directoryDB, null, 2)
            );
            res.status(200).json({
                success: true,
                message: "Directory renamed successfully",
                directory,
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
async function deleteDirectoryRecursively(dirId) {
    const dirIndex = directoryDB.findIndex((d) => d.id === dirId);
    if (dirIndex === -1) return;

    const dirData = directoryDB[dirIndex];

    // 🔥 Delete files (DB + disk)
    for (const fileId of dirData.content.files) {
        const fileIndex = filesDB.findIndex((f) => f.id === fileId);
        if (fileIndex !== -1) {
            const file = filesDB[fileIndex];
            const filename = `${file.id}${file.ext}`;

            // remove file from disk
            await rm(`./storage/${filename}`, { force: true });

            // remove from DB
            filesDB.splice(fileIndex, 1);
        }
    }

    // 🔁 Recursively delete subdirectories
    for (const subDirId of dirData.content.directories) {
        await deleteDirectoryRecursively(subDirId);
    }

    // ❌ Remove directory itself from DB
    directoryDB.splice(dirIndex, 1);
}

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const dirData = directoryDB.find((dir) => dir.id === id);
        if (!dirData) {
            return res
                .status(404)
                .json({ success: false, message: "Directory not found" });
        }

        // Remove reference from parent
        if (dirData.parentId) {
            const parentDir = directoryDB.find(
                (dir) => dir.id === dirData.parentId
            );
            if (parentDir) {
                parentDir.content.directories =
                    parentDir.content.directories.filter(
                        (dirId) => dirId !== id
                    );
            }
        }

        // Recursive delete
        await deleteDirectoryRecursively(id);

        await writeFile(
            "./directoryDB.json",
            JSON.stringify(directoryDB, null, 2)
        );
        await writeFile("./filesDB.json", JSON.stringify(filesDB, null, 2));

        res.status(200).json({
            success: true,
            message: "Directory and all nested contents deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;
