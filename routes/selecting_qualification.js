const router = require("express").Router();
const conn = require("../db/dbConnection");
const authorized = require("../middleware/authorize");
const admin = require("../middleware/admin");
const { body, validationResult } = require("express-validator");
const util = require("util"); // helper


// SELECTING QUALIFICATION FOR JOBS [ADMIN]
router.post(
    "",
    admin,
    body("job_id").isNumeric().withMessage("please enter a valid job ID"),
    body("qualification_id").isNumeric().withMessage("please enter a valid qualification ID"),
    async (req, res) => {
      try {
        const query = util.promisify(conn.query).bind(conn);
        // 1- VALIDATION REQUEST 
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors);
          return res.status(400).json({ errors: errors.array() });
        } 
        // 2- CHECK IF qualification EXISTS OR NOT
        const qualification = await query("select * from qualification where id = ?", [
          req.body.qualification_id,
        ]);
        if (!qualification[0]) {
          res.status(404).json({ ms: "qualification not found !" });
          return;
        }
         // 3- CHECK IF JOB EXISTS OR NOT
        const jobs = await query("select * from jobs where id = ?", [
            req.body.job_id,
          ]);
          if (!jobs[0]) {
            res.status(404).json({ ms: "job not found !" });
            return;
          }
          const qualifications = await query("select * from qualification_for_jobs  where qualification_id = ? AND job_id = ?", [
            req.body.qualification_id , req.body.job_id
          ]);
          if (qualifications[0]) {
            res.status(404).json({ ms: "qualification already selected gor this job !" });
            return;
          }
        // 4 - PREPARE JOB REQUEST OBJECT
        const selectingQualification = {
        job_id: jobs[0].id,
        qualification_id: qualification[0].id
        };
  
        // 5- INSERT REQUEST OBJECT INTO DATABASE
        await query("insert into qualification_for_jobs set ?", selectingQualification);
  
        res.status(200).json({
          msg: "qualification_for_jobs selected successfully !",
        });
      } catch (err) {
        res.status(500).json(err);
      }
    }
  );
  
  // SHOW QUALIFICATION FOR SPECIFIC JOB [ADMIN]
router.get("/:id",admin, async (req, res) => {
  const query = util.promisify(conn.query).bind(conn);
  const job = await query("select * from jobs where id = ?", [
    req.params.id,
  ]);
  if (!job[0]) {
    res.status(404).json({ ms: "job not found !" });
    return;
  }
  const qualifications = await query("select qualification.description from qualification join qualification_for_jobs on qualification_for_jobs.qualification_id = qualification.id where job_id = ?", [
    req.params.id,
  ]);
  if (!qualifications[0]) {
    console.log(qualifications)
    res.status(404).json({ ms: "There is no qualifications for this job!" });
    return;
  }
  res.status(200).json(qualifications);
});

  module.exports = router;