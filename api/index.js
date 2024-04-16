import express from "express";

export const app = express();

import { getAllUsers, getUser, createUser, getLinkTree, addLink, editPage, deleteLink, changeUserDetails, deleteUser } from "../database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { checkUser } from "../authController.js";
dotenv.config();
import bodyParser from "body-parser";

app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});
app.get("/users", async (req, res) => {
    const users = await getAllUsers();
    res.json({
        results: users.length,
        users,
    });
});

app.post("/singup", async (req, res) => {
    const { name, username, password, bio } = req.body;
    const salt = await bcrypt.genSalt(14);
    const hashedPass = await bcrypt.hash(password, salt);
    const [err, id] = await createUser({ name, username, password: hashedPass, bio });

    if (!err) {
        const token = await jwt.sign({ id }, process.env.SECRET);
        res.status(201).json({
            status: "created",
            token,
        });
    } else {
        res.status(400).json({
            status: "failed",
            message: err.message,
        });
    }
});
app.get("/:username", async (req, res) => {
    const { username } = req.params;
    const [pageData, links] = await getLinkTree(username);
    return res.json({
        status: "success",
        data: {
            pageData,
            links,
        },
    });
});
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const [user, page, links] = await getUser(username);
    if (!user || !(await bcrypt.compare(password, user.password)))
        return res.json({
            status: "fail",
            message: "Username or password incorrect !",
        });
    const token = await jwt.sign({ id: user.id }, process.env.SECRET);
    res.json({
        status: "success",
        token,
        data: {
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                bio: user.bio,
            },
            page,
            links,
        },
    });
});

app.post("/addLink/:userId", checkUser, async (req, res) => {
    const { userId } = req.params;
    const { url, bg_color, radius } = req.body;
    const err = await addLink({ userId, url, bg_color, radius });
    if (!err) res.status(201).end();
    else {
        res.json({
            status: "failed",
            message: err?.message,
        });
    }
});

app.delete("/deleteLink/:userId", checkUser, async (req, res, next) => {
    const { userId } = req.params;
    const { linkId } = req.body;
    const err = await deleteLink({ userId, linkId });
    if (!err) {
        return res.status(204).end();
    } else {
        return next(err);
    }
});
app.delete("/deleteAccount/:userId", checkUser, async (req, res, next) => {
    const { userId } = req.params;
    const err = await deleteUser(userId);
    if (!err) {
        return res.status(204).end();
    } else {
        return next(err.message);
    }
});

app.patch("/editPage/:userId", checkUser, async (req, res, next) => {
    const { userId } = req.params;
    const { font, background } = req.body;
    const err = await editPage({ userId, font, background });
    if (!err) {
        res.status(201).end();
    } else return next(err);
});
app.patch("/changeDetails/:userId/:field", checkUser, async (req, res, next) => {
    const { userId, field } = req.params;
    const { newValue } = req.body;
    let value = newValue;
    if (field == "password") {
        const salt = await bcrypt.genSalt(14);
        value = await bcrypt.hash(newValue, salt);
    }

    const err = await changeUserDetails({ field, userId, value });
    if (!err) {
        return res.status(204).end();
    } else {
        next(err);
    }
});

app.get("/is/logedIn", checkUser, async (req, res) => {
    res.json({
        logedIn: true,
    });
});

// app.get("/addCol/now", async (req, res) => {
//     const data = await addCol();
//     res.json({
//         data,
//     });
// });

app.use((err, req, res, next) => {
    res.status(400).json({
        status: "fail",
        message: err,
    });
});

const port = 3307;
// const port = process.env.PORT;
app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});
