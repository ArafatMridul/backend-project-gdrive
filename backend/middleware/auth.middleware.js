import { ObjectId } from "mongodb";

export default async function checkAuth(req, res, next) {
    try {
        const { uid } = req.cookies;
        if (!uid) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
        }

        if (!ObjectId.isValid(uid)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format.",
            });
        }

        const db = req.db;
        const userCollection = db.collection("users");
        const user = await userCollection.findOne({
            _id: new ObjectId(uid),
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found. Please log in again.",
            });
        }
        req.user = user;

        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({
            success: false,
            message: "Authentication server error.",
        });
    }
}
