const router = require("express").Router();
const conn = require("../db/dbConnection");
const authorized = require("../middleware/authorize");
const admin = require("../middleware/admin");
const { body, validationResult } = require("express-validator");
const util = require("util"); // helper


// MAKE REQUEST [USER]
router.post(
    "",
    authorized,
    body("job_id").isNumeric().withMessage("please enter a valid job ID"),
    async (req, res) => {
      try {
        const query = util.promisify(conn.query).bind(conn);
        // 1- VALIDATION REQUEST 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors);
          return res.status(400).json({ errors: errors.array() });
        } 
        // 2- CHECK IF JOB EXISTS OR NOT
        const jobs = await query("select * from jobs where id = ?", [
          req.body.job_id,
        ]);
        if (!jobs[0]) {
          res.status(404).json({ ms: "job not found !" });
          return;
        }
  
        // 3 - PREPARE JOB REQUEST OBJECT
        const requestObj = {
        user_id: res.locals.user.id,
        job_id: jobs[0].id,
        };
  
        // 4- INSERT REQUEST OBJECT INTO DATABASE
        await query("insert into request_job set ?", requestObj);
  
        res.status(200).json({
          msg: "request added successfully !",
        });
      } catch (err) {
        console.log(err);
        res.status(500).json(err);
      }
    }
  );
  
  

// ACCEPT OR REJECT REQUESTS [ADMIN]
router.put(
  "/:id", // params
  admin,
body("response")
.isIn(["accept","reject"]).withMessage("please enter a valid response accept or reject")
  .isString()
  .withMessage("please enter a valid response"),
  async (req, res) => {
    try {
      // 1- VALIDATION REQUEST 
      const query = util.promisify(conn.query).bind(conn);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 2- CHECK IF REQUEST EXISTS OR NOT
      const requests = await query("select * from request_job where request_id = ?", [
        req.params.id,
      ]);
      if (!requests[0]) {
        res.status(404).json({ ms: "request not found !" });
        return;
      }

      // 3- UPDATE REQUEST
      await query("update request_job set ? where request_id = ?", [{response: req.body.response}, requests[0].request_id]);
      console.log(requests[0]);
      res.status(200).json({
        msg: `request ${req.body.response}ed successfully`,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);



// THE HISTORY OF ALL REQUESTS OF APLLICANTS [ADMIN]
router.get("", admin,async (req, res) => {
  const query = util.promisify(conn.query).bind(conn);
  const requests = await query("select users.email,users.name,jobs.title,request_job.request_id,request_job.response from users join request_job on users.id=request_job.user_id join jobs on request_job.job_id=jobs.id");
  if (!requests[0]) {
    res.status(404).json({ ms: "THERE IS NO REQUESTS!" });
    return;
  }
  res.status(200).json(requests);
});

// SHOW THE HISTORY OF ALL REQUESTS OF APLLICANT [USER]
router.get("/userhistory", authorized, async (req, res) => {

  const query = util.promisify(conn.query).bind(conn);
  const requests = await query("select  users.email,jobs.title,request_job.response,request_job.request_id from users join request_job on request_job.user_id = users.id join jobs on request_job.job_id=jobs.id where users.id = ?", [
    res.locals.user.id,
  ]);
  if (!requests[0]) {
    res.status(404).json({ ms: "NO REQUESTS FOR THIS USER!" });
    return;
  }
  res.status(200).json(requests);
});

module.exports = router;
