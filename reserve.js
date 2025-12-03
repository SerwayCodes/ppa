const students_router = require("./routes/studentRoutes");

// Define a route to fetch modules for a specific student
students_router.get("/student-modules/:studentId", async (req, res) => {
  const studentId = req.params.studentId;

  try {
    // Use SQL JOIN to fetch module IDs and names for the specified student
    const modules = await db.any(
      `
     SELECT mc.course_id, c.course_name
      FROM student_course AS mc
      INNER JOIN courses AS c ON mc.course_id = c.course_id
      WHERE mc.student_id =  $1
    `,
      [studentId]
    );

    res.json(modules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({ error: "Error fetching modules" });
  }
});

// Start the Express server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
