const studentId = document.getElementById("student_id"); // Example student ID
$.ajax({
  url: `/fetchStudentDetails/${studentId}`,
  method: "GET",
  success: function (data) {
    $("#studentName").text(data.full_name);
    $("#feesBalance").text(data.fees_balance);
  },
  error: function (error) {
    console.error(error);
  },
});

