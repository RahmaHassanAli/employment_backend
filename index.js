// ==================== INITIALIZE EXPRESS APP ====================
const express = require("express");
const app = express();

// ====================  GLOBAL MIDDLEWARE ====================
app.use(express.json());

app.use(express.urlencoded({ extended: true })); // TO ACCESS URL FORM ENCODED
app.use(express.static("upload"));
const cors = require("cors");
app.use(cors()); // ALLOW HTTP REQUESTS LOCAL HOSTS

// ====================  Required Module ====================
const auth = require("./routes/auth");
const jobs = require("./routes/jobs");
const qualification = require("./routes/qualification");
const requestJob = require("./routes/requestJob");
const manage_users = require("./routes/manage_users");
const selecting_qualification = require("./routes/selecting_qualification");
// ====================  RUN THE APP  ====================
app.listen(4000, "localhost", () => {
  console.log("SERVER IS RUNNING ");
});

// ====================  API ROUTES [ ENDPOINTS ]  ====================
app.use("/auth", auth);
app.use("/jobs", jobs);
app.use("/qualification", qualification);
app.use("/requestJob", requestJob);
app.use("/manage_users", manage_users);
app.use("/selecting_qualification", selecting_qualification);


