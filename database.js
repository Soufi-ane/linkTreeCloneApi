import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql
    .createPool({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        port: process.env.PORT,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE,
        connectionLimit: 30,
    })
    .promise();
pool.getConnection()
    .then((con) => console.log("connected to the database"))
    .catch((err) => console.log("error connecting to the database"));

export async function getAllUsers() {
    const [users] = await pool.query("SELECT id , name , username , bio FROM users");
    return users;
}

export async function findUser(ID) {
    const user = await pool.query("SELECT id FROM users WHERE id = ?", [ID]);
    return user;
}

export async function getUserInfo(ID) {
    const [links] = await pool.query("SELECT url , bg_color , radius FROM users JOIN links ON links.user_id = users.id WHERE users.id = ?  ;", [ID]);
    const [[pageData]] = await pool.query("SELECT name , username, background , font ,bio FROM users JOIN pages ON pages.user_id = users.id WHERE users.id = ?", [ID]);
    return [pageData , links] ;
}


export async function getLinkTree(username) {
    const [links] = await pool.query("SELECT url , bg_color  , radius FROM users JOIN links ON links.user_id = users.id WHERE username = ?  ;", [username]);
    const [[pageData]] = await pool.query("SELECT name , username, background , font ,bio FROM users JOIN pages ON pages.user_id = users.id WHERE users.username = ?", [username]);
    return [pageData, links];
}

export async function getUser(username) {
    const [[user]] = await pool.query("SELECT * FROM users WHERE username = ?  ", [username]);

    const [[page]] = await pool.query("SELECT pages.id , background ,font , user_id FROM users join pages on username = ? ;", [username]);
    const [links] = await pool.query("SELECT links.id , url , bg_color ,radius , user_id FROM users join links on username = ? ; ", [username]);
    return [user, page, links];
}
export async function createUser({ name, username, password, bio }) {
    try {
        await pool.query("INSERT INTO users (name , username, password , bio) VALUES  (? , ? , ? , ? ) ; ", [name, username, password, bio]);

        const [[newUser]] = await pool.query("SELECT id FROM users WHERE username = ? ; ", [username]);

        await pool.query("INSERT INTO pages (user_id ) VALUES (?) ;", [newUser.id]);

        return [null, newUser.id];
    } catch (err) {
        console.log(err);
        return [new Error("Failed to create user"), null];
    }
}

export async function addLink({ userId, url, bg_color, radius }) {
    try {
        await pool.query("INSERT INTO links (user_id, url, bg_color , radius) VALUES (?,?,?,?) ; ", [userId, url, bg_color, radius]);
    } catch (err) {
        return new Error("Failed to create link");
    }
}

export async function deleteLink({ userId, linkId }) {
    try {
        await pool.query("DELETE FROM links WHERE id = ? AND user_id = ? ; ", [linkId, userId]);
    } catch {
        return new Error("Failed to delete link");
    }
}

export async function editPage({ userId, font, background }) {
    try {
        await pool.query("UPDATE pages SET font = ? , background = ? WHERE user_id = ? ;", [font, background, userId]);
    } catch {
        return new Error("Failed to edit page");
    }
}

export async function changeUserDetails({ field, userId, value }) {
    // #MOST_UNSECURED_QUERY_HH
    try {
        await pool.query(`UPDATE users SET ${field} = ? WHERE id = ? ; `, [value, userId]);
    } catch (err) {
        console.log(err);
        return new Error("Failed to edit details");
    }
}

export async function deleteUser(userId) {
    try {
        await pool.query("DELETE FROM users WHERE id = ? ", [userId]);
    } catch {
        return new Error("Failed to delete user Account");
    }
}

// export async function UpdatePasswordState(userId, value) {
//     try {
//         await pool.query("UPDATE users SET changedPassAfterLogin = ? WHERE id = ? ;"[(value, userId)]);
//     } catch (err) {
//         console.error(err);
//     }
// }
// export async function getPasswordState(userId) {
//     const state = await pool.query("SELECT changedPass FROM users WHERE id = ? ", [userId]);
//     console.log(state);
// }

// export async function addCol() {
//     const data = await pool.query("SHOW tables  ; ");
//     return data;
// }
