const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./db");
const bcrypt = require("bcrypt");

function initialize(passport) {
  const authenticateUser = async (email, password, done) => {
    await pool.query(`SELECT * FROM users WHERE email = $1`, [email], (err, results) => {
      if (err) {
        return done(err); // Pass the error to Passport's done function
      }

      if (results.rows.length > 0) {
        const user = results.rows[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            return done(err); // Pass the error to Passport's done function
          }
          if (isMatch) {
            // Update the last_login column for the user
            pool.query("UPDATE users SET last_login = NOW() WHERE email = $1", [email], (err) => {
              if (err) {
                console.error("Error updating last_login:", error);
                return done(err); // Pass the error to Passport's done function
              }
              return done(null, user); // Authentication successful
            });
          } else {
            // Password is incorrect
            return done(null, false, { message: "Password is incorrect" });
          }
        });
      } else {
        // No user
        return done(null, false, { message: "No user with that email address" });
      }
    });
  };

  passport.use(new LocalStrategy({ usernameField: "email", passwordField: "password" }, authenticateUser));

  // Stores user details inside the session.
  passport.serializeUser((user, done) => done(null, user.email));

  // In deserializeUser, find the user by email and attach it to the request object.
  passport.deserializeUser((email, done) => {
    pool.query(`SELECT * FROM users WHERE email = $1`, [email], (err, results) => {
      if (err) {
        return done(err);
      }
      return done(null, results.rows[0]);
    });
  });
}

module.exports = initialize;
