import express from "express";
import { createWriteStream } from "fs";
import { rename, rm, writeFile } from "fs/promises";
import mime from "mime-types";
import path from "path";
import filesDB from "../filesDB.json" with { type: "json" };
import directoryDB from "../directoryDB.json" with { type: "json" };

const router = express.Router();

// upload file
router.post("/:filename", async (req, res) => {
    const { uid } = req.cookies;
    const parentDirId =
        req.headers.parentdirid ||
        directoryDB.find((dir) => dir.parentId === null && dir.userId === uid)
            .id;
    try {
        const filename = req.params.filename;
        const id = crypto.randomUUID();
        const ext = path.extname(filename);
        const fullFilename = `${id}${ext}`;
        const writestream = createWriteStream(`./storage/${fullFilename}`);
        req.pipe(writestream);
        req.on("end", async () => {
            filesDB.push({ id, name: filename, ext, parentDirId });
            const parentDirData = directoryDB.find(
                (dir) => dir.id === parentDirId
            );
            parentDirData.content.files.push(id);
            await writeFile("./filesDB.json", JSON.stringify(filesDB, null, 2));
            await writeFile(
                "./directoryDB.json",
                JSON.stringify(directoryDB, null, 2)
            );
            res.status(200).json({ success: true, message: "File uploaded" });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error uploading file",
        });
    }
});

// get specific file
router.get("/:id", (req, res) => {
    try {
        const { id } = req.params;
        const fileRecord = filesDB.find((file) => file.id === id);
        res.setHeader("Content-Type", mime.lookup(fileRecord.name));
        if (req.query.action === "download") {
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${fileRecord.name}"`
            );
        }
        res.sendFile(`${id}${fileRecord.ext}`, { root: "./storage" });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching file",
        });
    }
});

// rename file
router.patch("/rename/:id", async (req, res) => {
    const { id } = req.params;
    const { newfilename } = req.body;
    try {
        const fileRecord = filesDB.find((file) => file.id === id);
        const newExt = path.extname(newfilename);
        await rename(
            `./storage/${id}${fileRecord.ext}`,
            `./storage/${id}${newExt}`
        );
        fileRecord.ext = newExt;
        fileRecord.name = newfilename;
        await writeFile("./filesDB.json", JSON.stringify(filesDB, null, 2));
        res.status(200).json({
            success: true,
            message: "File renamed successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error renaming file",
        });
    }
});

// delete file
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    const parentDirId =
        req.headers.parentdirid ||
        directoryDB.find((dir) => dir.parentId === null).id;
    try {
        const fileRecordIndex = filesDB.findIndex((file) => file.id === id);
        const filename = `${id}${filesDB[fileRecordIndex].ext}`;
        filesDB.splice(fileRecordIndex, 1);
        const parentDirData = directoryDB.find((dir) => dir.id === parentDirId);
        parentDirData.content.files = parentDirData.content.files.filter(
            (fileId) => fileId !== id
        );
        await writeFile("./filesDB.json", JSON.stringify(filesDB, null, 2));
        await writeFile(
            "./directoryDB.json",
            JSON.stringify(directoryDB, null, 2)
        );
        await rm(`./storage/${filename}`);
        res.status(200).json({
            success: true,
            message: "File deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting file",
        });
    }
});

export default router;
