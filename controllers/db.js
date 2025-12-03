const Pool = require("pg").Pool;
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

    // TO BE DISABLED WHEN WORKING AT LOCAL HOST
  //  ssl: { rejectUnauthorized: false }



});

// Connect to the database
pool
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL database");
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL database:", err);
  });

module.exports = { pool };
