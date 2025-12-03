const express = require("express");
const { pool } = require("../controllers/db");
const lecturer_route = express.Router();
const bcrypt = require("bcrypt");
const moment = require("moment");

//---------------------------------------------------------------------------------------------------------------------------------
//GENERAL FUNCTIONS
//---------------------------------------------------------------------------------------------------------------------------------
const get_lecturer_details = async (user_id) => {
  try {
    const query = `
      SELECT 
     * FROM lecturers
      
      WHERE user_id = $1;
    `;

    const result = await pool.query(query, [user_id]);

    return result.rows[0];
  } catch (error) {
    console.error("Error in getLecturerData:", error.message);
    throw error;
  }
};

async function getLecturerDetails(lecturerId) {
  const query = `
    SELECT lc.course_id, c.course_name, c.program_id, COUNT(sc.student_id) AS num_students
    FROM lecturer_course lc
    INNER JOIN courses c ON lc.course_id = c.course_id
    LEFT JOIN student_course sc ON lc.course_id = sc.course_id
    WHERE lc.lecturer_id = $1
    GROUP BY lc.course_id, c.course_name, c.program_id
  `;

  try {
    const { rows } = await pool.query(query, [lecturerId]);
    return rows;
  } catch (error) {
    throw error;
  }
}
//---------------------------------------------------------------------------------------------------------------------------------
// TIME TABLE
//---------------------------------------------------------------------------------------------------------------------------------

lecturer_route.get("/time-table", checkAuthMode, async (req, res) => {
  const lecturer_details = await get_lecturer_details(req.user.user_id);
  res.render("lecturers/time-table.ejs", {
    user_role: req.user.user_role,
    user: lecturer_details.first_name,
  });
});
//---------------------------------------------------------------------------------------------------------------------------------
//UPDATING DATAILS
//---------------------------------------------------------------------------------------------------------------------------------

lecturer_route.get("/registration", checkAuthMode, async (req, res) => {
  const lecturer_details = await get_lecturer_details(req.user.user_id);
  res.render("lecturers/registration.ejs", {
    user_role: req.user.user_role,
    user: lecturer_details.first_name,
  });
});

lecturer_route.post("/registration", checkAuthMode, async (req, res) => {
  try {
    const {
      phone_number,
      date_of_birth,
      nationality,
      district,
      village,
      tradi_auth,
      gender,
      address,
    } = req.body;
    await pool.query(
      "UPDATE lecturers SET phone_number=$1, date_of_birth=$2, nationality=$3, district=$4, village=$5,tradi_auth=$6, gender=$7,address=$8 WHERE lecturer_id=$9",
      [
        phone_number,
        date_of_birth,
        nationality,
        district,
        village,
        tradi_auth,
        gender,
        address,
        req.user.user_id,
      ]
    );
    req.flash("success", "You have successfully updated your details");

    res.redirect("lecturer_dashboard");
  } catch (error) {
    req.flash("error", `Error: ${error}`);

    console.log(error);
    res.redirect("lecturer_dashboard");
  }
});

//---------------------------------------------------------------------------------------------------------------------------------
//PROFILE
//---------------------------------------------------------------------------------------------------------------------------------

lecturer_route.get("/profile", checkAuthMode, async (req, res) => {
  const lecturer_details = await get_lecturer_details(req.user.user_id);

  lecturer_details.email = req.user.email;
  lecturer_details.date_of_birth = moment(
    lecturer_details.date_of_birth
  ).format("YYYY-MM-DD");
  res.render("lecturers/profile.ejs", {
    user_role: req.user.user_role,
    user: lecturer_details.first_name,
    lecturer_details,
  });
});
//---------------------------------------------------------------------------------------------------------------------------------
//UPDATE PASSWORD
//---------------------------------------------------------------------------------------------------------------------------------

lecturer_route.post("/update-password", checkAuthMode, async (req, res) => {
  const { password } = req.body;

  if (password.length > 0) {
    hashedPassword = await bcrypt.hash(password, 10);

    pool.query(
      "UPDATE users SET password = $1 WHERE user_id = $2",
      [hashedPassword, req.user.user_id],
      (error, results) => {
        if (error) {
          throw error;
        }
        req.flash("success", "Your password has been updated successifully");
        res.redirect(`profile`);
      }
    );
  }
});
//---------------------------------------------------------------------------------------------------------------------------------
// CLASSES
//---------------------------------------------------------------------------------------------------------------------------------

lecturer_route.get("/classes", checkAuthMode, async (req, res) => {
  try {
    const lecturerId = req.user.user_id;
    const lecturerDetails = await getLecturerDetails(lecturerId);
    res.render("lecturers/classes.ejs", {
      user_role: req.user.user_role,
      user: req.user.first_name,
      classes: lecturerDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

lecturer_route.get("/students_list", checkAuthMode, async (req, res) => {
  try {
    const module_id = req.query.id;
    const query = await pool.query(
      "SELECT sc.student_id, s.first_name, s.last_name, s.fees_balance FROM student_course sc INNER JOIN students s ON sc.student_id = s.student_id WHERE sc.course_id = $1",
      [module_id]
    );

    const students = query.rows;

    students.forEach((student) => {
      if (student.fees_balance > 0) {
        student.allowed_class = "NO";
      } else {
        student.allowed_class = "YES";
      }
    });

    res.render("lecturers/student_list", {
      user_role: req.user.user_role,
      user: req.user.first_name,
      students: students,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//---------------------------------------------------------------------------------------------------------------------------------
//DASHBOARD
//---------------------------------------------------------------------------------------------------------------------------------
lecturer_route.get("/", checkAuthMode, async (req, res) => {
  try {
    const lecturer_details = await get_lecturer_details(req.user.user_id);
 
    const student = await pool.query(
      "SELECT * FROM students WHERE is_current=$1",
      [true]
    );
    const total_classes = await pool.query(
      "SELECT * FROM lecturer_course WHERE lecturer_id=$1",
      [req.user.user_id]
    );

    lecturer_details.total_students = student.rowCount;
    lecturer_details.total_classes = total_classes.rowCount;
    lecturer_details.total_hrs = lecturer_details.total_classes * 4;
    lecturer_details.total_lessons = lecturer_details.total_classes * 2;


    const result = await pool.query('Select * from calendar_events');
  
 

    const events = await Promise.all(
      result.rows.map(async (event) => {
       
        // Format the transaction_date property of the transaction
        event.start_date = moment(
        event.start_date
        ).format("D MMMM YYYY");
  
        event.end_date = moment(
          event.end_date
          ).format("D MMMM YYYY");
    
        return event;
      })
    );
  

    res.render("lecturers/lecturer_dashboard", {
      user_role: req.user.user_role,
      user: lecturer_details.first_name,
      lecturer_details,
      events
    });
  } catch (error) {
    // Handle errors, e.g., send an error response or render an error page
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

lecturer_route.get("/lecturer_dashboard", checkAuthMode, (req, res) => {
  res.redirect("/lecturers");
});

//---------------------------------------------------------------------------------------------------------------------------------

lecturer_route.get("/logout", checkAuthMode, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    // Redirect the user to the login page
    res.redirect("/login");
  });
});

function checkAuthMode(req, res, next) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate");
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("../../login");
}

module.exports = lecturer_route;
