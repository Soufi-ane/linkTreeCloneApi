import express from "express";
export const app = express();
import { getAllUsers, getUser, createUser, getLinkTree, addLink } from "../database.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { checkUser } from "../authController.js";
dotenv.config();

app.use(express.json());
app.get("/users", async (req, res) => {
    const users = await getAllUsers();
    res.json({
        results: users.length,
        users,
    });
});
app.get("/users/:ID", async (req, res) => {
    const { ID } = req.params;
    const user = await getUser(ID);
    res.json(user);
});

app.post("/singup", async (req, res) => {
    const { name, username, age, email, password } = req.body;
    const salt = await bcrypt.genSalt(14);
    const hashedPass = await bcrypt.hash(password, salt);
    const [err, id] = await createUser({ name, username, age, email, password: hashedPass });

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
    const { email, password } = req.body;
    const [user, page, links] = await getUser({ email, password });
    if (!user || !(await bcrypt.compare(password, user.password)))
        return res.json({
            status: "fail",
            message: "Email or password incorrect !",
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
                picture: user.image,
                email: user.email,
                age: user.age,
            },
            page,
            links,
        },
    });
});

app.post("/addLink/:userId", checkUser, async (req, res) => {
    const { userId } = req.params;
    const { url, bg_color, icon, radius } = req.body;
    const err = await addLink({ userId, url, bg_color, icon, radius });
    if (!err) res.status(201).end();
    else {
        res.json({
            status: "failed",
            message: err?.message,
        });
    }
});

app.patch("/editPage/:userId", checkUser, async (req, res) => {
    const { userId } = req.params;
});

app.delete("/users/:ID", (req, res) => {
    const { ID } = req.params;
    deleteUser(ID);
    res.send("deleted");
});

app.use((err, req, res, next) => {
    res.json({
        status: "fail",
        message: err,
    });
});

const port = process.env.PORT;
app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});
