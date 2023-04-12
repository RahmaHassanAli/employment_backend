const router = require("express").Router();
const conn = require("../db/dbConnection");
const authorized = require("../middleware/authorize");
const admin = require("../middleware/admin");
const { body, validationResult } = require("express-validator");
const upload = require("../middleware/uploadImages");
const util = require("util"); // helper
const fs = require("fs"); // file system

// CREATE job [ADMIN]
router.post(
  "",
  admin,
  body("title")
    .isString()
    .withMessage("please enter a valid title for job ")
    .isLength({ min: 5 })
    .withMessage("description name should be at lease 5 characters"),
  body("position")
  .isIn(["full time","part time"]).withMessage("please enter a valid position part time or full time")
    .isString()
    .withMessage("please enter a valid position"),
  body("description")
    .isString()
    .withMessage("please enter a valid description ")
    .isLength({ min: 10 })
    .withMessage("description name should be at lease 10 characters"),
    body("offer")
    .isString()
    .withMessage("please enter a valid offer ")
    .isLength({ min: 5 })
    .withMessage("description name should be at lease 5 characters"),
    body("candidate_number")
    .isNumeric()
    .withMessage("please enter a valid candidate-number "),
    body("qualification_id").isNumeric().withMessage("please enter a valid qualification ID"),
  async (req, res) => {
    try {
      // 1- VALIDATION REQUEST
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
    // 2- CHECK IF qualification EXISTS OR NOT
    const query = util.promisify(conn.query).bind(conn);
    const qualification = await query("select * from qualification where id = ?", [
      req.body.qualification_id,
      console.log(req.body.qualification_id)
    ]);
    if (!qualification[0]) {
      res.status(404).json({ ms: "qualification not found !" });
    }
      // 3- PREPARE job OBJECT
      const job = {
        title: req.body.title,
        position: req.body.position,
        description: req.body.description,
        offer:req.body.offer,
        candidate_number: req.body.candidate_number,
        qualification_id : req.body.qualification_id
      };
      console.log(job);
      // 4 - INSERT job INTO DB
      await query("insert into jobs set ? ", job);
      res.status(200).json(job);
      // res.status(200).json({
      //   msg: "job created successfully !",
      // });
    } catch (err) {
      res.status(500).json(err);
      console.log(err);
    }
  }
);


// UPDATE job [ADMIN]
router.put(
  "/:id", // params
  admin,
  body("title")
  .isString()
  .withMessage("please enter a valid title for job ")
  .isLength({ min: 5 })
  .withMessage("description name should be at lease 5 characters"),
body("position")
.isIn(["full time","part time"]).withMessage("please enter a valid position part time or full time")
  .isString()
  .withMessage("please enter a valid position"),
body("description")
  .isString()
  .withMessage("please enter a valid description ")
  .isLength({ min: 10 })
  .withMessage("description name should be at lease 10 characters"),
  body("offer")
  .isString()
  .withMessage("please enter a valid offer ")
  .isLength({ min: 5 })
  .withMessage("description name should be at lease 5 characters"),
  body("candidate_number")
  .isNumeric()
  .withMessage("please enter a valid candidate-number "),
  body("qualification_id").isNumeric().withMessage("please enter a valid qualification ID"),
  async (req, res) => {
    try {
      // 1- VALIDATION REQUEST 
      const query = util.promisify(conn.query).bind(conn);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 2- CHECK IF job EXISTS OR NOT
      const job = await query("select * from jobs where id = ?", [
        req.params.id,
      ]);
      if (!job[0]) {
        res.status(404).json({ ms: "job not found !" });
      }

      // 3- PREPARE job OBJECT
      const jobOject = {
        title: req.body.title,
        position: req.body.position,
        description: req.body.description,
        offer:req.body.offer,
        candidate_number: req.body.candidate_number,
        qualification_id : req.body.qualification_id
      };

      // 2- CHECK IF qualification EXISTS OR NOT
    const qualification = await query("select * from qualification where id = ?", [
      req.body.qualification_id,
    ]);
    if (!qualification[0]) {
      res.status(404).json({ ms: "qualification not found !" });
    }

      // 4- UPDATE job
      await query("update jobs set ? where id = ?", [jobOject, job[0].id]);

      res.status(200).json({
        msg: "job updated successfully",
      });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// DELETE job [ADMIN]
router.delete(
  "/:id", // params
  admin,
  async (req, res) => {
    try {
      // 1- CHECK IF job EXISTS OR NOT
      const query = util.promisify(conn.query).bind(conn);
      const job = await query("select * from jobs where id = ?", [
        req.params.id,
      ]);
      if (!job[0]) {
        res.status(404).json({ ms: "job not found !" });
      }
      await query("delete from jobs where id = ?", [job[0].id]);
      res.status(200).json({
        msg: "job delete successfully",
      });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// LIST & SEARCH [ADMIN, USER]
router.get("", async (req, res) => {
  const query = util.promisify(conn.query).bind(conn);
  let search = "";
  if (req.query.search) {
    // QUERY PARAMS
    search = `where title LIKE '%${req.query.search}%'`;
  }
  const jobs = await query(`select * from jobs ${search}`);
  res.status(200).json(jobs);
});

// SHOW job [ADMIN, USER]
router.get("/:id", async (req, res) => {
  const query = util.promisify(conn.query).bind(conn);
  const jobs = await query("select * from jobs where id = ?", [
    req.params.id,
  ]);
  if (!jobs[0]) {
    res.status(404).json({ ms: "job not found !" });
  }
  res.status(200).json(jobs[0]);
});

module.exports = router;
