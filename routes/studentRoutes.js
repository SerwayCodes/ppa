//===================================================================================================
//TABLE OF CONTENTS FOR STUDENT ROUTER/ ENDPOINTS
//1. Get student details functions which is used to get all the details of the student and can be reused
//2. Log out endpoint
//3. check authentication status endpoint
//4. DASHBOARD
//5. REGISTRATION PROCESS AND MODULE SELECTION
//6. STUDENT PROFILE (gettting student ptofile and password update)
//7. GETTING ENROLLED MODULES
//8. EXAMS RESULTS ACCESSING
//9. FEES , checking fees transactions
//===================================================================================================

const express = require("express");
const students_router = express.Router();
const { pool } = require("../controllers/db");
const moment = require("moment");
const bcrypt = require("bcrypt");

//-----------------------------------------------------------------------------------------------------------------------------------

const get_student_details = async (user_id) => {
  try {
    const query = `
      SELECT 
     * FROM students
      
      WHERE user_id = $1;
    `;

    const result = await pool.query(query, [user_id]);

    return result.rows[0];
  } catch (error) {
    console.error("Error in getStudentData:", error.message);
    throw error;
  }
};

students_router.get("/logout", checkAuthMode, (req, res) => {
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
//-----------------------------------------------------------------------------------------------------------------------------------
//DASHBOARD
//-----------------------------------------------------------------------------------------------------------------------------------

students_router.get("/", checkAuthMode, async (req, res) => {
  const student_details = await get_student_details(req.user.user_id);
  const now = moment().format("YYYY-MM-DD");
  student_details.registration_start_date = moment(
    student_details.registration_start_date
  ).format("YYYY-MM-DD");
  student_details.registration_end_date = moment(
    student_details.registration_end_date
  ).format("YYYY-MM-DD");

  const result = await pool.query("Select * from calendar_events");

  const events = await Promise.all(
    result.rows.map(async (event) => {
      // Format the transaction_date property of the transaction
      event.start_date = moment(event.start_date).format("D MMMM YYYY");

      event.end_date = moment(event.end_date).format("D MMMM YYYY");

      return event;
    })
  );

  res.render("students/student-dashboard", {
    user_role: req.user.user_role,
    user: student_details.first_name,
    student_details,
    now,
    events,
  });
});

students_router.get("/student-dashboard", checkAuthMode, async (req, res) => {
  res.redirect("/students");
});

students_router.get("/register", checkAuthMode, async (req, res) => {
  try {
    const student_details = await get_student_details(req.user.user_id);

    const modulesResult = await pool.query(
      "SELECT * FROM courses WHERE program_id = $1",
      [student_details.allocated_program]
    );
    const modules = modulesResult.rows; // Extract the rows from the result

    if (student_details.date_of_birth === null) {
      student_details.hasEverRegistered = false;
    } else {
      student_details.hasEverRegistered = true;
    }

    res.render("students/register", {
      user_role: req.user.user_role,
      user: student_details.first_name,
      student_details,
      modules,
    });
  } catch (error) {
    console.error("Error fetching data from the database:", error);

    res
      .status(500)
      .send("An error occurred while fetching data from the database.");
  }
});
//-----------------------------------------------------------------------------------------------------------------------------------------------
//REGISTRATION PROCESS AND MODULE SELECTION
//-----------------------------------------------------------------------------------------------------------------------------------------------

students_router.post("/student-register", checkAuthMode, async (req, res) => {
  try {
    // Assuming you have the student ID in the request (you may have your own method for this)
    const student = await get_student_details(req.user.user_id);
    const studentId = student.student_id;
    const programId = student.program_id;

    // Collect the data from the request body
    const {
      phone_number,
      contact_address,
      selectedModules,
      totalTuition,
      nationality,
      district,
      tradi_auth,
      village,
      date_of_birth,
      gender,
      next_of_kin_name,
      next_of_kin_address,
      next_of_kin_relationship,
      next_of_kin_phone_number,
      next_of_kin_email,
    } = req.body;

    const dateOfBirth = moment(date_of_birth).format("YYYY-MM-DD");

    await pool.query("BEGIN");

    try {
      // Insert student details into the "students" table
      const studentInsertQuery = `
        UPDATE students
        SET phone_number = $1,
            contact_address = $2,
            nationality = $3,
            district = $4,
            tradi_auth = $5,
            village = $6,
            date_of_birth = $7,
            gender = $8,
            next_of_kin_name = $9,
            next_of_kin_address = $10,
            next_of_kin_relationship = $11,
            next_of_kin_phone_number = $12,
            next_of_kin_email = $13,
            registration_status = true,
            fees_balance=$14
        WHERE student_id = $15
      `;
      await pool.query(studentInsertQuery, [
        phone_number,
        contact_address,
        nationality,
        district,
        tradi_auth,
        village,
        dateOfBirth,
        gender,
        next_of_kin_name,
        next_of_kin_address,
        next_of_kin_relationship,
        next_of_kin_phone_number,
        next_of_kin_email,
        totalTuition,
        studentId,
      ]);

      // Insert selected modules into the "student_course" table
      for (const moduleId of selectedModules) {
        const moduleInsertQuery = `
          INSERT INTO student_course (student_id, course_id, program_id)
          VALUES ($1, $2,$3)
        `;
        await pool.query(moduleInsertQuery, [studentId, moduleId, programId]);
      }

      // Commit the transaction
      await pool.query("COMMIT");

      // Send a response indicating success
      res.json({ message: "Registration successful" });
    } catch (error) {
      console.log("error");
      // If an error occurs, rollback the transaction
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//-----------------------------------------------------------------------------------------------------------------------------------
//STUDENT PROFILE (gettting student ptofile and password update)
//-----------------------------------------------------------------------------------------------------------------------------------

students_router.get("/profile", checkAuthMode, async (req, res) => {
  const student_details = await get_student_details(req.user.user_id);
  student_details.email = req.user.email;

  student_details.date_of_birth = moment(student_details.date_of_birth).format(
    "D MMMM YYYY"
  );

  res.render("students/profile.ejs", {
    user_role: req.user.user_role,
    user: student_details.first_name,
    student_details,
  });
});

students_router.post("/update-password", checkAuthMode, async (req, res) => {
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

//-----------------------------------------------------------------------------------------------------------------------------------
// GETTING ENROLLED MODULES
//-----------------------------------------------------------------------------------------------------------------------------------

students_router.get("/subjects", checkAuthMode, async (req, res) => {
  try {
    const student_details = await get_student_details(req.user.user_id);

    // Use SQL JOIN to fetch module IDs and names for the specified student
    const getmodules = await pool.query(
      `
     SELECT mc.course_id, c.course_name
      FROM student_course AS mc
      INNER JOIN courses AS c ON mc.course_id = c.course_id
      WHERE mc.student_id =  $1
    `,
      [student_details.student_id]
    );
    const modules = getmodules.rows;

    res.render("students/subjects.ejs", {
      user_role: req.user.user_role,
      user: student_details.first_name,
      modules,
    });
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({ error: "Error fetching modules" });
  }
});

//-----------------------------------------------------------------------------------------------------------------------------------
//EXAMS RESULTS ACCESSING
//-----------------------------------------------------------------------------------------------------------------------------------

students_router.get("/exams", checkAuthMode, async (req, res) => {
  const student_details = await get_student_details(req.user.user_id);
  const examResultsQuery = `
        SELECT  session,
          JSON_AGG(JSON_BUILD_OBJECT(
            'student_id', student_id,
            'course_name', course_name,
            'grade', grade
          )) AS exam_results
        FROM exam_results
        WHERE student_id = $1 
        GROUP BY  session
        ORDER BY  session;
      `;

  const examResultsData = await pool.query(examResultsQuery, [
    student_details.student_id,
  ]);
  const exam_results = examResultsData.rows;

  res.render("students/exams.ejs", {
    user_role: req.user.user_role,
    user: student_details.first_name,
    exam_results,
  });
});

//-----------------------------------------------------------------------------------------------------------------------------------
//FEES , checking fees transactions
//-----------------------------------------------------------------------------------------------------------------------------------

students_router.get("/fees", checkAuthMode, async (req, res) => {
  try {
    const student_details = await get_student_details(req.user.user_id);

    // Use student_details.student_id to access the student_id
    const feestrans = await pool.query(
      "SELECT * FROM fees_transactions WHERE student_id=$1",
      [student_details.student_id] // Use student_details.student_id
    );

    // Format the transaction_date for each fees transaction
    const fees = feestrans.rows.map((fee) => ({
      fee,
      transaction_date: moment(fee.transaction_date).format("D MMMM YYYY"),
    }));

    res.render("students/fees.ejs", {
      user_role: req.user.user_role,
      user: student_details.first_name,
      fees,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//-----------------------------------------------------------------------------------------------------------------------------------

module.exports = students_router;
