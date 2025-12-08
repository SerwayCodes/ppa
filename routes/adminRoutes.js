//TO DO LIST
//AFTER ADDING THE STUDENTS RESULT MAKE THE ADDING CONDITION TO TRUE AND DISABLE THE ADD RESULTS BUTTON AND REDIRECT TO THE CLASS PAGE WITH THE MESSAGE
//GETTTING A STUDENT DETAILS EITHER HE/ SHE HAS ONLY PERSONAL DETAILS WITHOUT EXAMS
//ADD THE LINK TO THE STUDENTS DASHBOARD WHEN THE RESULTS ARE OUT

const express = require("express");
const admin_router = express.Router();
const { pool } = require("../controllers/db");
const moment = require("moment");
const bcrypt = require("bcrypt");
const { configDotenv } = require("dotenv");
const flash = require("express-flash");
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');

//GLOBAL FUNCTIONS
//---------------------------------------------------------------------------
const get_admin_details = async (user_id) => {
  try {
    const query = `
      SELECT 
     * FROM admins
      
      WHERE user_id = $1;
    `;

    const result = await pool.query(query, [user_id]);

    return result.rows[0];
  } catch (error) {
    console.error("Error in get Admin Data:", error.message);
    throw error;
  }
};

// Function to fetch counts
async function fetchCounts() {
  try {
    // Fetch total teachers count
    const teachersQuery = "SELECT COUNT(*) FROM teachers";
    const teachersResult = await pool.query(teachersQuery);
    const totalTeachers = teachersResult.rows[0].count;

    // Fetch total current students count
    const studentsQuery = "SELECT COUNT(*) FROM students";
    const studentsResult = await pool.query(studentsQuery);
    const totalCurrentStudents = studentsResult.rows[0].count;



    return {
      totalTeachers,
      totalCurrentStudents,
     
    };
  } catch (err) {
    console.error("Error fetching counts:", err);
    throw err;
  }
}

function checkAuthMode(req, res, next) {
  res.header("Cache-Control", "no-cache, private, no-store, must-revalidate");
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("../../login");
}
//-------------------------------------------------------------------------------------

//ADMIN ROUTES FOR ADMIN
//-------------------------------------------------------------------------------------
// this is perfecto
admin_router.get("/", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  const counts = await fetchCounts();

  const result = await pool.query("Select * from calendar_events");

  const events = await Promise.all(
    result.rows.map(async (event) => {
      // Format the transaction_date property of the transaction
      event.start_date = moment(event.start_date).format("D MMMM YYYY");

      event.end_date = moment(event.end_date).format("D MMMM YYYY");

      return event;
    })
  );

  res.render("administrators/admin_dashboard", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
    counts,
    events,
  });
});

admin_router.get("/admin_dashboard", checkAuthMode, async (req, res) => {
  res.redirect("/administrators");
});

admin_router.get("/fetch_student_data", async (req, res) => {
  try {
    const programValues = ["1", "2", "3", "4"];
    const query = {
      text: "SELECT * FROM students WHERE is_current = true AND form_level= ANY($1)",
      values: [programValues],
    };
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching student data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
admin_router.get("/profile", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  const admin_details = getAdmin;
  admin_details.email = req.user.email;

  res.render("administrators/profile", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
    admin_details,
  });
});

//accessing add admin page
admin_router.get("/add_admin", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);

  res.render("administrators/add_admin", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
  });
});
// adding a new admin

admin_router.post("/add_admin", checkAuthMode, async (req, res) => {
  let { admin_id, email, last_name, first_name } = req.body;

  //data validation
  if (!first_name || !last_name || !email || !admin_id) {
    req.flash("error", "Error: All fields are required.");
    res.redirect("add_admin");
  }

  //assigning a admin role
  const user_role = req.user.user_role;

  // Check if a admin with the provided email or user_id already exists
  pool.query(
    "SELECT user_id, email FROM users WHERE user_id = $1 OR email = $2",
    [admin_id, email],
    (checkError, checkResults) => {
      if (checkError) {
        req.flash("error", "Error: Unable to add admin.");
        res.redirect("add_admin");
      } else if (checkResults.rows.length > 0) {
        // User with the given email or ID already exists

        req.flash(
          "error",
          `User with ID ${admin_id} or email ${email} already exists.`
        );
        res.redirect("add_admin");
      } else {
        // Insert the new admin record if it doesn't already exist
        pool.query("BEGIN", (beginError) => {
          if (beginError) {
            req.flash("error", "Error: Unable to add admin.");
            res.redirect("add_admin");
          }

          // Insert the new user record into the users table
          pool.query(
            "INSERT INTO users (user_id, email, user_role) VALUES ($1, $2, $3) RETURNING user_id",
            [admin_id, email, user_role],
            (insertUserError, insertUserResults) => {
              if (insertUserError) {
                req.flash("error", "Error: Unable to add admin.");
                return rollbackAndRender(res);
              }

              // Insert the new admin record into the admins table
              pool.query(
                "INSERT INTO admins (first_name, last_name, user_id, admin_id) VALUES ($1, $2, $3, $4)",
                [first_name, last_name, admin_id, admin_id],
                (insertadminError, insertadminResults) => {
                  if (insertadminError) {
                    req.flash("error", "Error: Unable to add admin.");
                    return rollbackAndRender(res);
                  }

                  // Commit the transaction if both inserts were successful
                  pool.query("COMMIT", (commitError) => {
                    if (commitError) {
                      req.flash("error", "Error: Unable to add admin.");
                      return rollbackAndRender(res);
                    }

                    req.flash("success", `admin added with ID ${admin_id}`);
                    res.redirect("add_admin");
                  });
                }
              );
            }
          );
        });

        function rollbackAndRender(res) {
          // Rollback the transaction in case of an error and render an error message
          pool.query("ROLLBACK", (rollbackError) => {
            if (rollbackError) {
              console.error("Error rolling back transaction:", rollbackError);
            }
            req.flash("error", "Error: Unable to add admin.");
            res.redirect("add_admin");
          });
        }
      }
    }
  );
});

//-------------------------------------------------------------------------------------

//admin student routes
//-------------------------------------------------------------------------------------
//accessing add student page
admin_router.get("/add_student", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
    res.render("administrators/add_student", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      
    });
  
});
//adding astudent
admin_router.post("/add_student", checkAuthMode, async (req, res) => {
  const {
    first_name,
    last_name,
    student_id,
    email,
    form_level,
    password,
    
  } = req.body;
  hashedPassword = await bcrypt.hash(password, 10);

  //data validation
  if (
    !first_name ||
    !last_name ||
    !student_id ||
    !email ||
    !form_level ||
    !password
  ) {
    req.flash("error", "Error: All fields are required.");
    res.redirect("add_student");
  }

  //assigning a student role
  const user_role = "Student";
  // Check if a student with the provided student_id already exists

  pool.query(
    "SELECT student_id FROM students WHERE student_id = $1",
    [student_id],
    (checkStudentError, checkStudentResults) => {
      if (checkStudentError) {
        req.flash("error", "Error: Unable to add student.");
        return res.redirect("add_student");
      } else if (checkStudentResults.rows.length > 0) {
        // Student with the given student_id already exists
        req.flash("error", `Student with ID ${student_id} already exists.`);
        return res.redirect("add_student");
      }

      // Check if a user with the provided student_id or email already exists
      pool.query(
        "SELECT user_id, email FROM users WHERE user_id = $1 OR email = $2",
        [student_id, email],
        (checkUserError, checkUserResults) => {
          if (checkUserError) {
            req.flash("error", "Error: Unable to add student.");
            return res.redirect("add_student");
          } else if (checkUserResults.rows.length > 0) {
            // User with the given user_id or email already exists

            req.flash(
              "error",
              `User with ID ${student_id} or email ${email} already exists.`
            );
            return res.redirect("add_student");
          } else {
            // Insert the new student record if it doesn't already exist
            pool.query("BEGIN", (beginError) => {
              if (beginError) {
                req.flash("error", "Error: Unable to add student.");
                return res.redirect("add_student");
              }

              // Insert the new user record into the users table
              pool.query(
                "INSERT INTO users (user_id, email, password, user_role) VALUES ($1, $2,$3, $4) RETURNING user_id",
                [student_id, email, hashedPassword, user_role],
                (insertUserError, insertUserResults) => {
                  if (insertUserError) {
                    req.flash("error", "Error: Unable to add student.");
                    return rollbackAndRender(res);
                  }

                  // Insert the new student record into the students table
                  pool.query(
                    "INSERT INTO students (first_name, last_name, user_id, student_id,form_level) VALUES ($1, $2, $3, $4,$5)",
                    [
                      first_name,
                      last_name,
                      student_id,
                      student_id,
                      form_level,
                
                    ],
                    (insertstudentError, insertstudentResults) => {
                      if (insertstudentError) {
                        req.flash("error", "Error: Unable to add student.");
                        return rollbackAndRender(res);
                      }

                      // Commit the transaction if both inserts were successful
                      pool.query("COMMIT", (commitError) => {
                        if (commitError) {
                          req.flash("error", "Error: Unable to add student.");
                          return rollbackAndRender(res);
                        }

                        req.flash(
                          "success",
                          `student added with ID ${student_id}`
                        );
                        res.redirect("add_student");
                      });
                    }
                  );
                }
              );
            });

            function rollbackAndRender(res) {
              // Rollback the transaction in case of an error and render an error message
              pool.query("ROLLBACK", (rollbackError) => {
                if (rollbackError) {
                  console.error(
                    "Error rolling back transaction:",
                    rollbackError
                  );
                }
                req.flash("error", "Error: Unable to add student.");
                res.redirect("add_student");
              });
            }
          }
        }
      );
    }
  );
});


//fetching students based on class
admin_router.get("/studentsfetch", checkAuthMode, async (req, res) => {
  const selectedClass = req.query.selectedClass;

  if (!selectedClass) {
    return res.status(400).json({ error: "Class is required" });
  }

  try {
    const sqlQuery = `
      SELECT student_id, first_name, last_name, form_level, fees_balance
      FROM students
      WHERE form_level = $1
      ORDER BY first_name;
    `;

    const studentData = await pool.query(sqlQuery, [selectedClass]);

    res.json({ students: studentData.rows });

  } catch (error) {
    console.error("Error fetching student data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Viewing one student details given  student id
admin_router.get(
  "/view_student/:student_id",
  checkAuthMode,
/// view student details will be implemented here
);

// Viewing a single student profile

admin_router.get("/student_profile", checkAuthMode, async (req, res) => {
  try {
    const studentId = req.query.studentId;
    const dataString = req.query.data;
    const data = JSON.parse(decodeURIComponent(dataString));

    const getAdmin = await get_admin_details(req.user.user_id);

    console.log(data);
    res.render("administrators/student_profile", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      data,
      studentId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//accessing students list page
admin_router.get("/students", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  try {
    // Fetch student data from the database

    const students = (
      await pool.query(
        "SELECT student_id, first_name, last_name, form_level,fees_balance FROM students ORDER BY first_name; "
      )
    ).rows;

    // Pass the data to the template for rendering
    res.render("administrators/students", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      students: students,
      
    });
  } catch (error) {
    console.error("Error fetching student data:", error);
    res.status(500).send("Internal Server Error");
  }
});
// control registration period
admin_router.get("/control-registration", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  res.render("administrators/control_reg", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
  });
});
//open registration period
admin_router.post("/open-registration", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  // Implement logic to open the registration period (e.g., check admin privileges)
  const registrationStartDate = moment().format("YYYY-MM-DD");
  const registrationEndDate = moment().add(1, "month").format("YYYY-MM-DD");

  // Update the database with the registration period dates
  pool.query(
    "UPDATE students SET registration_start_date = $1, registration_end_date = $2",
    [registrationStartDate, registrationEndDate],
    (err, result) => {
      if (err) {
        console.error("Error opening registration:", err);
        res.status(500).send("Error opening registration");
      } else {
        req.flash(
          "success",
          `Registration has been opened from  ${registrationStartDate} to ${registrationEndDate}  `
        );

        res.redirect("control-registration");
      }
    }
  );
});
//fetching student by student id 
admin_router.get("/fetchStudent/:studentId", async (req, res) => {
  const studentId = req.params.studentId;

  try {
    const query = `
      SELECT students.student_id, student_course.subject_id, subjects.subject_name
      FROM students
      INNER JOIN student_course ON students.student_id = student_course.student_id
      INNER JOIN subjects ON student_course.subject_id = subjects.subject_id
      WHERE students.student_id = $1
    `;

    const result = await pool.query(query, [studentId]);

    const studentData = result.rows;

    if (studentData.length > 0) {
      res.json({ modules: studentData });
    } else {
      res.status(404).json({ error: "Student not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//adding student results but it has to be changed to approve results
admin_router.get("/addStudent_results", checkAuthMode, async (req, res) => {
  try {
    const programId = req.query.programId;
    const studentId = req.query.studentId;
    const dataString = req.query.data;
    const data = JSON.parse(decodeURIComponent(dataString));

    const getAdmin = await get_admin_details(req.user.user_id);
    res.render("administrators/addStudent_results", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      data,
      studentId,
      programId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

admin_router.get("/exams", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  res.render("administrators/exams", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
  });
});

//printinting individual student report

admin_router.post('/print-individual-report', async (req, res) => {
    try {
        const { studentId, examType, termNumber, academicYear } = req.body;
        
        console.log('Received request:', { studentId, examType, termNumber, academicYear });
        
        // Validate input
        if (!studentId || !examType || !termNumber || !academicYear) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const term = `Term ${termNumber}`;
        
        // Get student basic info and all results in single query
        const reportQuery = `
            SELECT 
                s.student_id, s.first_name, s.last_name, s.form_level,
                c.class_name,
                er.term, er.academic_year, er.exam_type,
                json_agg(
                    json_build_object(
                        'subject_name', sub.subject_name,
                        'marks', er.marks,
                        'grade', er.grade,
                        'position', er.position_in_class
                    ) ORDER BY sub.subject_name
                ) as subjects,
                (SELECT AVG(marks) FROM exam_results WHERE student_id = $1 AND term = $2 AND academic_year = $3 AND exam_type = $4) as average_marks,
                (SELECT SUM(marks) FROM exam_results WHERE student_id = $1 AND term = $2 AND academic_year = $3 AND exam_type = $4) as total_marks,
                (SELECT position_in_class FROM exam_results WHERE student_id = $1 AND term = $2 AND academic_year = $3 AND exam_type = $4 LIMIT 1) as position,
                (SELECT total_students_in_class FROM exam_results WHERE student_id = $1 AND term = $2 AND academic_year = $3 AND exam_type = $4 LIMIT 1) as total_students
            FROM students s
            JOIN classes c ON s.form_level::text = c.form_level
            JOIN exam_results er ON s.student_id = er.student_id
            JOIN subjects sub ON er.subject_id = sub.subject_id
            WHERE s.student_id = $1 
              AND er.term = $2 
              AND er.academic_year = $3
              AND er.exam_type = $4
            GROUP BY s.student_id, s.first_name, s.last_name, s.form_level, c.class_name, er.term, er.academic_year, er.exam_type
        `;
        
        const reportResult = await pool.query(reportQuery, [studentId, term, academicYear, examType]);
        
        if (reportResult.rows.length === 0) {
            return res.status(404).json({ error: 'No exam results found for this student' });
        }
        
        const reportData = reportResult.rows[0];
        console.log('Report data retrieved for student:', reportData.student_id);
        
        // Ensure we have all required subjects for the form level
        const requiredSubjectsQuery = `
            SELECT subject_name 
            FROM subjects 
            WHERE form_level = $1 
            ORDER BY subject_name
        `;
        const requiredSubjects = await pool.query(requiredSubjectsQuery, [reportData.form_level]);
        
        // Merge actual results with required subjects to ensure all subjects appear in report
        const allSubjects = requiredSubjects.rows.map(reqSubj => {
            const actualResult = reportData.subjects.find(subj => 
                subj.subject_name === reqSubj.subject_name
            );
            return actualResult || {
                subject_name: reqSubj.subject_name,
                marks: null,
                grade: null,
                position: null
            };
        });

        console.log('Processed subjects:', allSubjects.length);

        // Helper functions for remarks
        const generateFormTeacherRemarks = (averageMarks) => {
            if (!averageMarks) return 'Results pending';
            if (averageMarks >= 80) return 'Excellent performance! Consistent hard work and dedication.';
            if (averageMarks >= 70) return 'Very good effort. Keep up the good work.';
            if (averageMarks >= 55) return 'Good performance. There is room for improvement.';
            if (averageMarks >= 40) return 'Satisfactory work. Needs to put in more effort.';
            return 'Needs significant improvement. Please focus on studies.';
        };

        const generatePrincipalRemarks = (averageMarks) => {
            if (!averageMarks) return 'Awaiting final assessment';
            if (averageMarks >= 80) return 'Outstanding academic achievement. A role model for other students.';
            if (averageMarks >= 70) return 'Commendable performance. Continue striving for excellence.';
            if (averageMarks >= 55) return 'Good progress shown. Focus on weak areas for better results.';
            if (averageMarks >= 40) return 'Average performance. Additional support and effort required.';
            return 'Immediate intervention needed. Parents requested to meet with administration.';
        };

        // Calculate overall grade based on average marks
        const calculateOverallGrade = (averageMarks) => {
            if (!averageMarks) return 'N/A';
            if (averageMarks >= 80) return 'A';
            if (averageMarks >= 70) return 'B';
            if (averageMarks >= 55) return 'C';
            if (averageMarks >= 40) return 'D';
            return 'F';
        };

        // Define helper functions for template
        const getRemarks = (grade) => {
            const remarks = {
                'A': 'Excellent',
                'B': 'Very Good', 
                'C': 'Good',
                'D': 'Satisfactory',
                'F': 'Needs Improvement'
            };
            return remarks[grade] || 'N/A';
        };

        const getOverallRemarks = (grade) => {
            const overallRemarks = {
                'A': 'Outstanding Performance',
                'B': 'Very Good Performance',
                'C': 'Good Performance', 
                'D': 'Average Performance',
                'F': 'Needs Significant Improvement'
            };
            return overallRemarks[grade] || 'N/A';
        };

        const getGradeClass = (grade) => {
            if (!grade) return '';
            switch(grade) {
                case 'A': return 'A';
                case 'B': return 'B';
                case 'C': return 'C';
                case 'D': return 'D';
                case 'F': return 'F';
                default: return '';
            }
        };

        // Prepare data for template
        const templateData = {
            student: {
                student_id: reportData.student_id,
                first_name: reportData.first_name,
                last_name: reportData.last_name,
                form_level: reportData.form_level
            },
            subjects: allSubjects,
            studentRank: {
                position: reportData.position || 'N/A',
                totalStudents: reportData.total_students || 'N/A',
                averageMarks: reportData.average_marks ? Math.round(reportData.average_marks) : 'N/A',
                totalMarks: reportData.total_marks || 'N/A',
                overallGrade: calculateOverallGrade(reportData.average_marks)
            },
            classInfo: { 
                class_name: reportData.class_name 
            },
            termNumber: termNumber,
            academicYear: academicYear,
            formTeacherRemarks: generateFormTeacherRemarks(reportData.average_marks),
            principalRemarks: generatePrincipalRemarks(reportData.average_marks),
            getRemarks: getRemarks,
            getOverallRemarks: getOverallRemarks,
            getGradeClass: getGradeClass
        };

        // Get the absolute path to the HTML template
        const templatePath = path.join(__dirname, '../views/reports/individual-report-html.ejs');
        console.log('Template path:', templatePath);
        
        // Check if template exists
        const fs = require('fs');
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
        }

        // Render the HTML report
        const html = await ejs.renderFile(templatePath, templateData);
        console.log('HTML report generated successfully');
        
        // Send HTML response
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ 
            error: 'Failed to generate report',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});
// Function to ensure class positions are updated before report generation
const updateClassPositions = async (term, academicYear, formLevel) => {
    try {
        await pool.query('SELECT update_class_positions($1, $2, $3)', [term, academicYear, formLevel]);
        console.log(`Class positions updated for ${term} ${academicYear} Form ${formLevel}`);
    } catch (error) {
        console.error('Error updating class positions:', error);
    }
};

// Function to get all form levels for bulk reporting
const getFormLevels = async () => {
    const result = await pool.query('SELECT form_level, class_name FROM classes ORDER BY form_level');
    return result.rows;
};


//releasing exams results to students
admin_router.post("/release_exams", checkAuthMode, async (req, res) => {
  try {
    pool.query(
      "UPDATE students SET exam_results_status=TRUE WHERE is_current= True AND registration_status=TRUE"
    );
    req.flash("success", "Exams Results have been Realesed Successifully");
    res.redirect("release_exams");
  } catch (error) {
    req.flash("error", "The operation has failed");
    res.redirect("release_exams");
  }
});

admin_router.post("/not-rem-exam", checkAuthMode, async (req, res) => {
  try {
    pool.query("UPDATE students SET exam_results_status=false");
    req.flash("success", "Notification disabled Successifully");
    res.redirect("release_exams");
  } catch (error) {
    req.flash("error", "The operation has failed");
    res.redirect("release_exams");
  }
});

//==============================================================================================

//-------------------------------------------------------------------------------------

//admin classes routes
//-------------------------------------------------------------------------------------

//CLASS GET ROUTES

admin_router.get("/class_list", checkAuthMode, async (req, res) => {
  try {
    const getAdmin = await get_admin_details(req.user.user_id);

    // Retrieve all programs from the programs table
    const programsData = await pool.query("SELECT * FROM classes");
    const classes = programsData.rows;

    // Create an array to store the count of students for each program
    const programStudentCounts = [];

    // Iterate through each program and fetch the count of current students
    for (const form of classes) {
      const { form_level } = form;
      const studentCountResult = await pool.query(
        "SELECT COUNT(*) FROM students WHERE is_current=true AND registration_status=true AND form_level=$1",
        [form_level]
      );
      const studentCount = studentCountResult.rows[0].count;
      programStudentCounts.push({
        form_level,
        student_count: studentCount,
      });
    }

    res.render("administrators/class_list", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      total_students: programStudentCounts.reduce(
        (total, program) => total + program.student_count,
        0
      ),
      classes: classes,
      programStudentCounts: programStudentCounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

admin_router.get("/view_class/:id", checkAuthMode, async (req, res) => {
  try {
    const programId = req.params.id; // Access the programId from query parameters

    // Fetch students based on the program ID from the database
    const result = await pool.query(
      "SELECT student_id, first_name, last_name FROM students WHERE is_current=true AND registration_status=true AND form_level=$1",
      [programId]
    );
    const students = result.rows;

    // Send the students data as a JSON response
    res.json({ students: students });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

admin_router.get("/students_class", checkAuthMode, async (req, res) => {
  try {
    const programId = req.query.programId;
    const dataString = req.query.data;
    const data = JSON.parse(decodeURIComponent(dataString));
    const getAdmin = await get_admin_details(req.user.user_id);
    res.render("administrators/students_class", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      data,
      programId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//==================================================================================================

//admin teacher router
//==================================================================================================





//accessing teachers list page
admin_router.get("/teacher", checkAuthMode, async (req, res) => {
  try {
    const getAdmin = await get_admin_details(req.user.user_id);

    const result = await pool.query(`
      SELECT teachers.*, 
             (SELECT COUNT(*) 
              FROM teacher_subject ts
              WHERE ts.teacher_id = teachers.teacher_id) AS subject_count
      FROM teachers
    `);

    const teachers = result.rows;

    res.render("administrators/teacher", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      teachers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});






// accessing the add teacher page
admin_router.get("/add_teacher", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  res.render("administrators/add_teacher", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
  });
});




//ADDING A teacher INTO THE SYSTEM
admin_router.post("/add_teacher", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);

  let { teacher_id, email, last_name, first_name, password } = req.body;

  hashedPassword = await bcrypt.hash(password, 10);

  //data validation
  if (!first_name || !last_name || !email || !teacher_id || !password) {
    req.flash("error", "Error: All fields are required.");
    res.redirect("add_teacher");
  }

  //assigning a teacher role
  const user_role = "Teacher";

  // Check if a teacher with the provided email or user_id already exists
  pool.query(
    "SELECT user_id, email FROM users WHERE user_id = $1 OR email = $2",
    [teacher_id, email],
    (checkError, checkResults) => {
      if (checkError) {
        req.flash("error", "Error: Unable to add teacher.");
        res.redirect("add_teacher");
      } else if (checkResults.rows.length > 0) {
        // User with the given email or ID already exists

        req.flash(
          "error",
          `User with ID ${teacher_id} or email ${email} already exists.`
        );
        res.redirect("add_teacher");
      } else {
        // Insert the new teacher record if it doesn't already exist
        pool.query("BEGIN", (beginError) => {
          if (beginError) {
            req.flash("error", "Error: Unable to add teacher.");
            return res.redirect("add_teacher");
          }

          // Insert the new user record into the users table
          pool.query(
            "INSERT INTO users (user_id, email, password, user_role) VALUES ($1, $2, $3, $4) RETURNING user_id",
            [teacher_id, email, hashedPassword, user_role],
            (insertUserError, insertUserResults) => {
              if (insertUserError) {
                req.flash("error", "Error: Unable to add teacher.");
                return rollbackAndRender(res);
              }

              // Insert the new teacher record into the teachers table
              pool.query(
                "INSERT INTO teachers (first_name, last_name, user_id, teacher_id) VALUES ($1, $2, $3, $4)",
                [first_name, last_name, teacher_id, teacher_id],
                (insertteacherError, insertteacherResults) => {
                  if (insertteacherError) {
                    req.flash("error", "Error: Unable to add teacher.");
                    return rollbackAndRender(res);
                  }

                  // Commit the transaction if both inserts were successful
                  pool.query("COMMIT", (commitError) => {
                    if (commitError) {
                      req.flash("error", "Error: Unable to add teacher.");
                      return rollbackAndRender(res);
                    }

                    req.flash(
                      "success",
                      `teacher added with ID ${teacher_id}`
                    );
                    res.redirect("add_teacher");
                  });
                }
              );
            }
          );
        });

        function rollbackAndRender(res) {
          // Rollback the transaction in case of an error and render an error message
          pool.query("ROLLBACK", (rollbackError) => {
            if (rollbackError) {
              console.error("Error rolling back transaction:", rollbackError);
            }
            req.flash("error", "Error: Unable to add teacher.");
            res.redirect("add_teacher");
          });
        }
      }
    }
  );
});

//accessing edit teacher page
admin_router.get("/teacherDetails/:id", checkAuthMode, async (req, res) => {
  try {
    const teacherId = req.params.id; // Replace 'your_teacher_id' with the actual teacher ID you want to query

    const result = await pool.query(
      `
      SELECT teachers.first_name, teachers.last_name, teacher_course.subject_id, subjects.subject_name
      FROM teachers
      INNER JOIN teacher_course ON teachers.teacher_id = teacher_course.teacher_id
      INNER JOIN subjects ON teacher_course.subject_id = subjects.subject_id
      WHERE teachers.teacher_id = $1
      `,
      [teacherId]
    );
    const teacherCourses = result.rows;

    // Send the students data as a JSON response
    res.json({ teacherModules: teacherCourses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

admin_router.get("/subject_assignment", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  const getteacher = await pool.query("SELECT * FROM teachers");
  const teachers = getteacher.rows;

  res.render("administrators/subject_assignment", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
    teachers,
  });
});

admin_router.post("/assign_subject", checkAuthMode, async (req, res) => {
  const { selectedModule, teacher_id } = req.body;

  // Check if the selectedModule and teacher_id combination already exists in teacher_course table
  const checkQuery = {
    text: "SELECT * FROM teacher_course WHERE subject_id = $1 ",
    values: [selectedModule],
  };

  try {
    const result = await pool.query(checkQuery);

    if (result.rows.length > 0) {
      // The combination already exists, send an error message
      req.flash(
        "error",
        "Error: This module is already assigned to the teacher."
      );
      // Inside the code where you handle form submission and redirect to the subject_assignment route
      res.redirect("subject_assignment");
    } else {
      // The combination does not exist, insert it into the course_teacher table
      const insertQuery = {
        text: "INSERT INTO teacher_course (subject_id, teacher_id) VALUES ($1, $2)",
        values: [selectedModule, teacher_id],
      };

      await pool.query(insertQuery);
      req.flash("success", "Subject assigned successfully.");
      res.redirect("subject_assignment");
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "Error: Failed to assign module. Please try again.");
    res.redirect("subject_assignment");
  }
});

// Endpoint for handling module deletion
admin_router.post("/deAssignSubject", async (req, res) => {
  const { teacherId, courseId } = req.body;

  try {
    await pool.query(
      "DELETE FROM teacher_course WHERE teacher_id = $1 AND subject_id = $2",
      [teacherId, courseId]
    );

    const result = await pool.query(
      `
      SELECT teachers.first_name, teachers.last_name, teacher_course.subject_id, subjects.subject_name
      FROM teachers
      INNER JOIN teacher_course ON teachers.teacher_id = teacher_course.teacher_id
      INNER JOIN subjects ON teacher_course.subject_id = subjects.subject_id
      WHERE teachers.teacher_id = $1
      `,
      [teacherId]
    );
    const teacherCourses = result.rows;
    req.flash("success", "Module successfully deassigned");
    res.json({ teacherModules: teacherCourses });
    // Redirect to teacher details page with a success message
  } catch (error) {
    req.flash("error", "Module deassignment failed");
    res.redirect(`teacher_modules`);
  }
});

admin_router.get("/teacher_modules", checkAuthMode, async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    const dataString = req.query.data;
    const data = JSON.parse(decodeURIComponent(dataString));
    const getAdmin = await get_admin_details(req.user.user_id);
    res.render("administrators/teacher_modules", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      data,
      teacherId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//-------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------

//admin modules list
//-------------------------------------------------------------------------------------

admin_router.get("/module_list", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);

  try {
    const modules = (await pool.query("SELECT * FROM subjects")).rows;

    // Pass the data to the template for rendering
    res.render("administrators/module_list", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      modules: modules,
    });
  } catch (error) {
    console.error("Error fetching student data:", error);
    res.status(500).send("Internal Server Error");
  }
});

admin_router.get("/add_Module", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  res.render("administrators/add_Module", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
  });
});

admin_router.get("/fetch_modules", checkAuthMode, async (req, res) => {
  const selectedClass = req.query.class; // Get the selected class value from the query parameters

  try {
    // Use a parameterized query to prevent SQL injection
    const query = {
      text: "SELECT * FROM subjects WHERE form_level = $1",
      values: [selectedClass],
    };

    // Execute the query
    const { rows } = await pool.query(query);

    // Send the modules as a JSON response
    res.json({ modules: rows });
  } catch (error) {
    // Handle errors, e.g., send a 500 Internal Server Error response
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//-------------------------------------------------------------------------------------

//admin fees acounts routes
//-------------------------------------------------------------------------------------

admin_router.get("/add_fees", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  res.render("administrators/add_fees", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
  });
});

admin_router.get("/fetchStudentDetails/:studentId", async (req, res) => {
  const studentId = req.params.studentId;

  //const studentId = encodeURIComponent(student_id)

  try {
    const result = await pool.query(
      "SELECT first_name, last_name, fees_balance FROM students WHERE student_id = $1",
      [studentId]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      // If no rows are returned, send a response indicating the student is not found
      res.json({ first_name: "not found", last_name: "", fees_balance: null });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

admin_router.post("/updateFees", checkAuthMode, async (req, res) => {
  const { student_id, transaction_amount, comment } = req.body;

  // Get the current timestamp
  const transaction_date = moment(Date.now()).format("YYYY-MM-DD");

  try {
    // Insert into fees_transactions table

    await pool.query(
      "INSERT INTO fees_transactions (student_id, transaction_amount,comment, issued_by,transaction_date) VALUES ($1, $2, $3, $4,$5)",
      [
        student_id,
        transaction_amount,
        comment,
        req.user.user_id,
        transaction_date,
      ]
    );

    // Subtract updated balance from initial balance
    await pool.query(
      "UPDATE students SET fees_balance = fees_balance - $1 WHERE student_id = $2",
      [transaction_amount, student_id]
    );

    req.flash("success", "Fees updated successfully");
    res.redirect("add_fees");
  } catch (error) {
    req.flash("error", "error, The operation was not successful");

    res.redirect("add_fees");
  }
});

admin_router.get("/fees_collections", checkAuthMode, async (req, res) => {
  try {
    const getAdmin = await get_admin_details(req.user.user_id);
    const transactionsData = await pool.query(
      "SELECT * FROM fees_transactions"
    );

    const transactions = await Promise.all(
      transactionsData.rows.map(async (transaction) => {
        const studentResult = await pool.query(
          "SELECT * FROM students WHERE student_id=$1",
          [transaction.student_id]
        );
        const student = studentResult.rows[0];
        if (student) {
          transaction.full_name = student.first_name + " " + student.last_name;
        } else {
          transaction.full_name = "Unknown Student";
        }

        // Format the transaction_date property of the transaction
        transaction.transaction_date = moment(
          transaction.transaction_date
        ).format("D MMMM YYYY");

        return transaction;
      })
    );

    res.render("administrators/fees_collections", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//-------------------------------------------------------------------------------------

//admin time table routes
//-------------------------------------------------------------------------------------
admin_router.get("/addEvent", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  res.render("administrators/add_calendar_events", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
  });
});

admin_router.post("/addEvent", checkAuthMode, async (req, res) => {
  const { start_date, end_date, event_name } = req.body;
  try {
    await pool.query(
      "INSERT INTO calendar_events(start_date, end_date, event_name) VALUES ($1,$2,$3)",
      [start_date, end_date, event_name]
    );
    req.flash("success", "successfully added new event!");
    res.redirect("addEvent");
  } catch (error) {
    req.flash("error", "Failed to add an event!");
    res.redirect("addEvent");
  }
});

admin_router.get("/time_table", checkAuthMode, (req, res) => {
  res.render("administrators/time_table", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
  });
});

//-------------------------------------------------------------------------------------
//password recovery
//-------------------------------------------------------------------------------------

admin_router.get("/password_recovery", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  res.render("administrators/password_recovery", {
    user_role: req.user.user_role,
    user: getAdmin.first_name,
    message: req.flash("message"),
    alert_class: null,
  });
});

admin_router.post("/password_recovery", checkAuthMode, async (req, res) => {
  const getAdmin = await get_admin_details(req.user.user_id);
  const { password, email } = req.body;
  // checking if email exist
  hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query("SELECT * FROM users where email =$1", [
    email,
  ]);
  if (result.rows == 0) {
    req.flash("message", "Error: No user with the Provided Email.");
    res.render("administrators/password_recovery", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      message: req.flash("message"),
      alert_class: "alert alert-danger",
    });
  } else {
    await pool.query("UPDATE users SET password=$1 WHERE email=$2", [
      hashedPassword,
      email,
    ]);
    req.flash(
      "message",
      ` Successfully recovered  the user's password for ${email}`
    );
    res.render("administrators/password_recovery", {
      user_role: req.user.user_role,
      user: getAdmin.first_name,
      message: req.flash("message"),
      alert_class: "alert alert-success",
    });
  }
});
//-------------------------------------------------------------------------------------

//admin log out route
//-------------------------------------------------------------------------------------

admin_router.get("/logout", checkAuthMode, (req, res) => {
  // Assuming you're using Express sessions, you can destroy the session here
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    // Redirect the user to the login page
    res.redirect("/login");
  });
});
//-------------------------------------------------------------------------------------

module.exports = admin_router;
