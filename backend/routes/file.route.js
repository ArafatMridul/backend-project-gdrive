import express from "express";
import { createWriteStream } from "fs";
import { rename, rm } from "fs/promises";
import mime from "mime-types";
import path from "path";
import { ObjectId } from "mongodb";

const router = express.Router();

// upload file
router.post("/:filename", async (req, res) => {
    const { uid } = req.cookies;
    try {
        const db = req.db;
        const filesCollection = db.collection("files");
        const directoryCollection = db.collection("directories");

        const parentDirId = req.headers["parentdirid"] || null;

        const parentDirData = parentDirId
            ? await directoryCollection.findOne({
                  _id: new ObjectId(parentDirId),
                  userId: new ObjectId(uid),
              })
            : await directoryCollection.findOne({
                  parentId: null,
                  userId: new ObjectId(uid),
              });
        const filename = req.params.filename;

        const ext = path.extname(filename);
        const id = crypto.randomUUID();
        const fullFilename = `${id}${ext}`;

        const writestream = createWriteStream(`./storage/${fullFilename}`);
        req.pipe(writestream);

        writestream.on("finish", async () => {
            const doc = {
                name: filename,
                ext,
                filename: fullFilename,
                parentDirId: parentDirData._id,
                userId: new ObjectId(uid),
            };

            await filesCollection.insertOne(doc);

            res.status(200).json({
                success: true,
                message: "File uploaded",
                file: doc,
            });
        });

        writestream.on("error", (err) => {
            console.error(err);
            res.status(500).json({ success: false });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error uploading file",
        });
    }
});

// get specific file
router.get("/:id", async (req, res) => {
    const { uid } = req.cookies;
    try {
        const { id } = req.params;
        const db = req.db;
        const filesCollection = db.collection("files");
        const fileRecord = await filesCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(uid),
        });
        if (!fileRecord) {
            return res.status(404).json({
                success: false,
                message: "File not found",
            });
        }
        res.setHeader("Content-Type", mime.lookup(fileRecord.name));
        if (req.query.action === "download") {
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${fileRecord.name}"`
            );
            // res.download(file_path, original_filename);
        }
        res.sendFile(`${fileRecord.filename}`, { root: "./storage" });
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
    const { uid } = req.cookies;
    const { newfilename } = req.body;
    try {
        const db = req.db;
        const filesCollection = db.collection("files");
        const fileRecord = await filesCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(uid),
        });
        const newExt = path.extname(newfilename);
        await rename(
            `./storage/${fileRecord.filename}`,
            `./storage/${fileRecord.filename.replace(
                path.extname(fileRecord.filename),
                newExt
            )}`
        );
        await filesCollection.updateOne(
            { _id: new ObjectId(id), userId: new ObjectId(uid) },
            {
                $set: {
                    name: newfilename,
                    ext: newExt,
                    filename: fileRecord.filename.replace(
                        path.extname(fileRecord.filename),
                        newExt
                    ),
                },
            }
        );
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
    const { uid } = req.cookies;
    try {
        const db = req.db;
        const filesCollection = db.collection("files");
        const fileRecord = await filesCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(uid),
        });
        const filename = fileRecord.filename;

        await filesCollection.deleteOne({ _id: new ObjectId(id) });
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
