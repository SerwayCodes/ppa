const express = require("express");
const Validator = require("./controllers/Validator");
const flash = require("express-flash");
const session = require("express-session");
const MemoryStore = require("memorystore")(session);
const passport = require("passport");
const path = require("path");
const admin_route = require("./routes/adminRoutes");
const students_route = require("./routes/studentRoutes");
const lecturer_route = require("./routes/lecturerRoutes");
const bodyParser = require("body-parser");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;
const initializePassport = require("./controllers/passportConfig");

initializePassport(passport);

const viewsPath = path.join(__dirname, "views");
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve the 'students' and 'admin' folders using express.static middleware
app.use("/students", express.static(path.join(viewsPath, "students")));
app.use(
  "/administrators",
  express.static(path.join(viewsPath, "administrators"))
);
app.use("/lecturers", express.static(path.join(viewsPath, "lecturers")));

app.set("view engine", "ejs");



app.use(
  session({
    // Key we want to keep secret which will encrypt all of our information
    secret: process.env.SESSION_SECRET,
    // Should we resave our session variables if nothing has changes which we dont
    resave: false,
    // Save empty value if there is no vaue which we do not want to do
    saveUninitialized: false,
    cookie: { maxAge: 18000000 },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  })
);
// Funtion inside passport which initializes passport
app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());
app.use(express.static("public"));
app.use("/students", students_route);
app.use("/administrators", admin_route);
app.use("/lecturers", lecturer_route);
//home route when user tries to access the system
app.get("/", (req, res) => {
  res.render("index.ejs");
});

//login route for permitted users
app.get("/login", (req, res) => {
  try {
    res.render("login.ejs");
  } catch (error) {
    res.render({ messages: error });
  }
});

//applications route for students applicants
app.get("/apply", (req, res) => {
  res.render("apply.ejs");
});

//account creation route for users

app.get("/default", (req, res) => {
  res.render("error-404.ejs");
});

// login route
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "roleBasedRedirect",
    failureRedirect: "login",
    failureFlash: true,
  })
);

// Creating a custom function to handle role-based redirection
app.get("/roleBasedRedirect", (req, res) => {
  const userRole = req.user.user_role;
  const user_id = req.user.user_id;
  console.log(user_id);

  // Determining the appropriate route based on the user's role
  let redirectRoute;
  switch (userRole) {
    case "Student":
      redirectRoute = "/students";
      break;
    case "Admin":
      redirectRoute = "/administrators";
      break;
    case "Lecturer":
      redirectRoute = "/lecturers";
      break;

    default:
      redirectRoute = "/default";
      break;
  }

  // Redirect the user to the determined route
  res.redirect(redirectRoute);
});

app.post(
  "/create_account",
  Validator.checkEmailAvailability,
  Validator.PasswordValidator
);

app.listen(PORT, () => {
  console.log(`the server is running on port ${PORT}`);
});
