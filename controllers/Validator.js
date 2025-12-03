const { pool } = require("./db");
const bcrypt = require("bcrypt");

//---------------------------------------------------------------------------------------------------------------------------------------------------
const passwordUpdate = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  let errors = [];

  if (!newPassword || !confirmPassword) {
    errors.push({ message: "Please enter all fields" });
  }

  if (newPassword.length < 5) {
    errors.push({ message: "Password must be a least 5 characters long" });
  }

  if (newPassword !== confirmPassword) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("student-details", { errors, newPassword, confirmPassword });
  } else {
    hashedPassword = await bcrypt.hash(newPassword, 10);

    pool.query(
      "UPDATE users SET password = $1 WHERE user_id = $2",
      [hashedPassword, req.user.user_id],
      (error, results) => {
        if (error) {
          throw error;
        }
        res.render("students/student-details", {
          user: req.user.user_id,
          success_msg: "Your password has been updated successifully",
        });
      }
    );
  }
};

//---------------------------------------------------------------------------------------------------------------------------------------------------

const PasswordValidator = async (req, res) => {
  const { password, password2, email } = req.body;

  let errors = [];

  if (!password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 5) {
    errors.push({ message: "Password must be a least 5 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("create_account", { errors, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);

    pool.query(
      "UPDATE users SET password = $1 WHERE email = $2",
      [hashedPassword, email],
      (error, results) => {
        if (error) {
          throw error;
        }
        res.status(200).send("Acount created successifully");
      }
    );
  }
};

//---------------------------------------------------------------------------------------------------------------------------------------------------

const checkEmailAvailability = (req, res, next) => {
  const email = req.body.email;

  pool.query(
    `SELECT * FROM users
            WHERE email = $1`,
    [email],
    (err, results) => {
      if (err) {
        console.log(err);
      }

      if (results.rows.length > 0) {
        next();
      } else {
        return res.render("create_account", {
          message: "Email Not Available",
        });
      }
    }
  );
};

//---------------------------------------------------------------------------------------------------------------------------------------------------

module.exports = {
  PasswordValidator,
  checkEmailAvailability,
  passwordUpdate,
};
