import pgpkg from "pg";
const { Client } = pgpkg;

import { config } from "dotenv";
config();

import * as fs from "fs/promises";

import * as fetch from "node-fetch";

const connectDb = async () => {
  try {
    const client = new Client({
      host: process.env.HOST,
      port: parseInt(process.env.PORT),
      database: process.env.DATABASE,
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
    });

    await client.connect();
    return client;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const client = await connectDb();

const token: string = process.env.DISCORD_TOKEN;

const fetchUser = async (id: string): Promise<any> => {
  const response = await fetch.default(
    `https://discord.com/api/v9/users/${id}`,
    {
      headers: {
        Authorization: `Bot ${token}`,
      },
    }
  );
  if (!response.ok) {
    console.log(`Error status code: ${response.status}`);
    return false;
  }
  return await response.json();
};

async function getUsers() {
  const users = await client.query("SELECT * FROM users");
  users.rows.sort((a, b) => b.rating - a.rating);
  const invalid = new Set();
  for (const user of users.rows) {
    const discordUser = await fetchUser(user.discord_id);
    if (!discordUser) {
      invalid.add(user.discord_id);
      continue;
    }
    user.username = discordUser.username;
    user.discriminator = discordUser.discriminator;
    user.avatar = discordUser.avatar;
  }
  users.rows = users.rows.filter((user) => !invalid.has(user.discord_id));
  // console.log(users.rows);
  await fs.writeFile(
    "../frontend/src/assets/users.json",
    JSON.stringify(users.rows),
    {
      flag: "w",
    }
  );
}

await getUsers();

client.end();
