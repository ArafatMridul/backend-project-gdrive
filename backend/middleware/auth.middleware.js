import userDB from "../userDB.json" with { type: "json" };

export default function checkAuth(req, res, next) {
    const { uid } = req.cookies;
    const userWithUid = userDB.find((user) => user.id === uid);
    if (!uid || !userWithUid)
        return res
            .status(404)
            .json({ success: false, message: "User not logged in." });
    next();
};
