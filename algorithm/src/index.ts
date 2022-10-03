import pgpkg from "pg";
const { Client } = pgpkg;

import { config } from "dotenv";
config();

import * as fs from "fs/promises";

import * as readline from "readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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

const idRegex = /<@!?(\d+)>/g;

const shortestFile = "s125.txt";
const fastestFile = "f125.txt";

const shortestContent = (await fs.readFile(shortestFile)).toString();
const fastestContent = (await fs.readFile(fastestFile)).toString();

// await client.query(`DELETE FROM users`);

async function updateUsers() {
  for (let id of shortestContent.matchAll(idRegex)) {
    await client.query(
      `INSERT INTO users (discord_id, rating, count) VALUES ('${id[1]}', 1000, 0) ON CONFLICT (discord_id) DO NOTHING`
    );
  }
}

await updateUsers();

async function updateRatings() {
  const actualRank = [];
  const expectedRank = [];

  let i = 0;
  for (let id of shortestContent.matchAll(idRegex)) {
    actualRank.push({
      id: id[1],
      shortest: i++,
      rank: 0,
      rating: 0,
    });

    const rating = (
      await client.query(
        `SELECT rating FROM users WHERE discord_id = '${id[1]}'`
      )
    ).rows[0].rating;
    expectedRank.push({
      id: id[1],
      rating: rating,
      rank: 0,
    });
  }

  i = 0;
  for (let id of fastestContent.matchAll(idRegex)) {
    const obj = actualRank.find((user) => user.id === id[1]);
    obj.rating = (obj.shortest + i++) / 2;
  }

  expectedRank.sort((a, b) => b.rating - a.rating);
  let lastIndex = 0;
  for (i = 0; i < expectedRank.length; i++) {
    if (i === 0 || expectedRank[i].rating !== expectedRank[i - 1].rating) {
      expectedRank[i].rank = i;
      lastIndex = i;
    } else {
      expectedRank[i].rank = lastIndex;
    }
  }

  actualRank.sort((a, b) => a.rating - b.rating);
  lastIndex = 0;
  for (i = 0; i < actualRank.length; i++) {
    if (i === 0 || actualRank[i].rating !== actualRank[i - 1].rating) {
      actualRank[i].rank = i;
      lastIndex = i;
    } else {
      actualRank[i].rank = lastIndex;
    }
  }

  // Calculate ranking diff

  const newElos = [];

  for (i = 0; i < expectedRank.length; i++) {
    const expectedRanking = expectedRank[i].rank;
    const obj = actualRank.find((x) => x.id === expectedRank[i].id);
    const actualRanking = obj.rank;

    const diff = expectedRanking - actualRanking;

    const eloChange = Math.round(
      (diff >= 0 ? -1300 / (diff + 13) + 100 : 1300 / (10 - diff) - 130) +
        (expectedRank.length * 2) / 3 +
        6 +
        Math.random() * 3
    );
    const newElo = expectedRank[i].rating + eloChange;

    if (true) {
      console.log(
        obj.id +
          "\t" +
          expectedRank[i].rating +
          "\t" +
          "s = " +
          obj.rating +
          "\t" +
          expectedRanking +
          "/" +
          actualRanking +
          "\t" +
          "diff = " +
          diff +
          "\t" +
          "+ " +
          eloChange +
          " = " +
          newElo
      );
    }

    newElos.push({
      id: obj.id,
      elo: newElo,
      change: eloChange,
    });
  }

  console.log(
    "Average elo change: " +
      newElos.reduce((a, b) => a + b.change, 0) / newElos.length
  );
  console.log(
    "Average new elo: " +
      newElos.reduce((a, b) => a + b.elo, 0) / newElos.length
  );

  const answer = await rl.question("Update elo? (y/n) ");
  if (answer === "y") {
    for (const user of newElos) {
      await client.query(
        `UPDATE users SET rating = ${user.elo}, count = count + 1 WHERE discord_id = '${user.id}'`
      );
    }
    console.log("ELO Updated.");
  }
}

await updateRatings();

client.end();
rl.close();
