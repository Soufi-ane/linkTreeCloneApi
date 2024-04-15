import { promisify } from "util";
import jwt from "jsonwebtoken";
import { findUser } from "./database.js";
export async function checkUser(req, res, next) {
    const { authorization } = req.headers;
    if (!authorization) {
        next("user is not authorized , please log in");
    }
    try {
        const encoded = await promisify(jwt.verify)(authorization, process.env.SECRET);

        const user = await findUser(encoded.id);

        if (!user) throw new Error("User not found , please sign up");
    } catch (err) {
        next(err.message);
    }
    next();
}
