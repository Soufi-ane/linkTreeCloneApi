import { promisify } from "util";
import jwt from "jsonwebtoken";
import { findUser } from "./database.js";
export async function checkUser(req, res, next) {
    const { authorization } = req.headers;
    if (!authorization) {
        res.json({
            status: "fail",
            message: "user is not authorized , please log in",
        });
    }
    try {
        const encoded = await promisify(jwt.verify)(authorization, process.env.SECRET);
        const user = findUser(req.params?.userId);
        if (!user) throw new Error("User not found , please sign up");
    } catch (err) {
        next(err.message);
    }
    next();
}
