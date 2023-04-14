const router = require("express").Router();
const conn = require("../db/dbConnection");
const authorized = require("../middleware/authorize");
const admin = require("../middleware/admin");
const { body, validationResult } = require("express-validator");
const util = require("util"); // helper


// CREATE Qualification [ADMIN]
router.post(
  "",
  admin,
  body("description")
    .isString()
    .withMessage("please enter a valid description ")
    .isLength({ min: 5 })
    .withMessage("description name should be at lease 5 characters"),
    async (req, res) => {
    try {
      // 1- VALIDATION REQUEST
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const query = util.promisify(conn.query).bind(conn);
      const qualifications = await query("select * from qualification where description = ?", [
        req.body.description,
      ]);
      if (qualifications[0]) {
        res.status(404).json({ ms: "qualification already existed !" });
        return;
      }
      // 3- PREPARE qualification OBJECT
      const qualification = {
        description: req.body.description,
      };
      // 4 - INSERT qualification INTO DB
      //const query = util.promisify(conn.query).bind(conn);
      await query("insert into qualification set ? ", qualification);
      res.status(200).json({
        msg: "qualification added successfully !",
      });
    } catch (err) {
      res.status(500).json(err);
      console.log(err);
    }
  }
);


// UPDATE qualifications [ADMIN]
router.put(
  "/:id", // params
  admin,
body("description")
  .isString()
  .withMessage("please enter a valid description ")
  .isLength({ min: 5 })
  .withMessage("description name should be at lease 5 characters"),
  async (req, res) => {
    try {
      // 1- VALIDATION REQUEST 
      const query = util.promisify(conn.query).bind(conn);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 2- CHECK IF qualification EXISTS OR NOT
      const qualifications = await query("select * from qualification where id = ?", [
        req.params.id,
      ]);
      if (!qualifications[0]) {
        res.status(404).json({ ms: "qualification not found !" });
        return;
      }

      // 3- PREPARE qualifications OBJECT
      const qualificationOject = {
        description: req.body.description,
      };
      // 4- UPDATE qualifications
      await query("update qualification set ? where id = ?", [qualificationOject, qualifications[0].id]);

      res.status(200).json({
        msg: "qualification updated successfully",
      });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// DELETE qualification [ADMIN]
router.delete(
  "/:id", // params
  admin,
  async (req, res) => {
    try {
      // 1- CHECK IF qualification EXISTS OR NOT
      const query = util.promisify(conn.query).bind(conn);
      const qualifications = await query("select * from qualification where id = ?", [
        req.params.id,
      ]);
      if (!qualifications[0]) {
        res.status(404).json({ ms: "qualification not found !" });
        return;
      }
      await query("delete from qualification where id = ?", [qualifications[0].id]);
      res.status(200).json({
        msg: "qualification delete successfully",
      });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// LIST & SEARCH [ADMIN]
router.get("", admin,async (req, res) => {
  const query = util.promisify(conn.query).bind(conn);
  let search = "";
  if (req.query.search) {
    // QUERY PARAMS
    search = `where description LIKE '%${req.query.search}%'`;
  }
  const qualifications = await query(`select * from qualification ${search}`);
  if (!qualifications[0]) {
    res.status(404).json({ ms: "qualification not found !" });
    return;
  }
  res.status(200).json(qualifications);
});

// SHOW qualifications [ADMIN]
router.get("/:id",admin, async (req, res) => {
  const query = util.promisify(conn.query).bind(conn);
  const qualifications = await query("select * from qualification where id = ?", [
    req.params.id,
  ]);
  if (!qualifications[0]) {
    res.status(404).json({ ms: "qualification not found !" });
    return;
  }
  res.status(200).json(qualifications[0]);
});

module.exports = router;
