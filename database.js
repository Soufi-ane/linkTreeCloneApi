import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();
const pool = mysql
    .createPool({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE,
    })
    .promise();
pool.getConnection()
    .then((con) => console.log("connected to the database"))
    .catch((err) => console.log("error connecting to the database"));

export async function getAllUsers() {
    const [users] = await pool.query("SELECT id , name FROM users");
    return users;
}

export async function findUser(ID) {
    const user = await pool.query("SELECT id FROM users WHERE id = ?", [ID]);
    console.log(user);
}

export async function getLinkTree(username) {
    const [links] = await pool.query("SELECT url , bg_color , icon , radius FROM users JOIN links ON links.user_id = users.id WHERE username = ?  ;", [username]);
    const [[pageData]] = await pool.query("SELECT name, image, background , font ,bio FROM users JOIN pages ON pages.user_id = users.id WHERE users.username = ?", [username]);
    return [pageData, links];
}

export async function getUser({ email, password }) {
    const [[user]] = await pool.query("SELECT * FROM users WHERE email = ?  ", [email]);

    const [[page]] = await pool.query("SELECT pages.id , background ,font , bio , user_id FROM users join pages on email = ? ;", [email]);
    const [links] = await pool.query("SELECT links.id , url ,icon , bg_color ,radius , user_id FROM users join links on email = ? ; ", [email]);
    return [user, page, links];
}
export async function createUser({ name, username, age, email, password }) {
    try {
        await pool.query("INSERT INTO users (name , username, age , email  , password) VALUES  (? , ? , ? , ? ,? ) ; ", [name, username, age, email, password]);

        const [[newUser]] = await pool.query("SELECT id FROM users WHERE username = ? ; ", [username]);

        await pool.query("INSERT INTO pages (font , bio , user_id ) VALUES (? , ? , ? ) ;", ["Poppins", null, newUser.id]);

        return [null, newUser.id];
    } catch (err) {
        console.log(err);
        return [new Error("Failed to create user"), null];
    }
}

export async function addLink({ userId, url, bg_color, icon, radius }) {
    try {
        await pool.query("INSERT INTO links (user_id, url, bg_color, icon, radius) VALUES (?,?,?,?,?) ; ", [userId, url, bg_color, icon, radius]);
    } catch (err) {
        return new Error("Failed to create link");
    }
}

// export async function editPage({})
