const router = require("express").Router();
const conn = require("../db/dbConnection");
const authorized = require("../middleware/authorize");
const admin = require("../middleware/admin");
const { body, validationResult } = require("express-validator");
const util = require("util"); // helper

const bcrypt = require("bcrypt");
const crypto = require("crypto");
// CREATE USER [ADMIN]
router.post(
  "",
  admin,
  body("email").isEmail().withMessage("please enter a valid email!"),
  body("name")
    .isString()
    .withMessage("please enter a valid name")
    .isLength({ min: 10, max: 20 })
    .withMessage("name should be between (10-20) character"),
  body("password")
    .isLength({ min: 8, max: 12 })
    .withMessage("password should be between (8-12) character"),
  body("phone").isMobilePhone()
    .withMessage("please enter a valid phoneNumber"),
  async (req, res) => {
    try {
      // 1- VALIDATION REQUEST [manual, express validation]
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 2- CHECK IF EMAIL EXISTS
      const query = util.promisify(conn.query).bind(conn); // transform query mysql --> promise to use [await/async]
      const checkEmailExists = await query(
        "select * from users where email = ?",
        [req.body.email]
      );
      if (checkEmailExists.length > 0) {
        res.status(400).json({
          errors: [
            {
              msg: "email already exists !",
            },
          ],
        });
        return;
      }

      const checkPhoneExists = await query(
        "select * from users where phone = ?",
        [req.body.phone]
      );
      if (checkPhoneExists.length > 0) {
        res.status(400).json({
          errors: [
            {
              msg: "this phone used before !",
            },
          ],
        });
        return;
      }

      // 3- PREPARE OBJECT USER TO -> SAVE
      const userData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        status:'active',
        password: await bcrypt.hash(req.body.password, 10),
        token: crypto.randomBytes(16).toString("hex"), // JSON WEB TOKEN, CRYPTO -> RANDOM ENCRYPTION STANDARD
      };

      // 4- INSERT USER OBJECT INTO DB
      await query("insert into users set ? ", userData);
      delete userData.password;
      res.status(200).json(userData);
    } catch (err) {
        console.log(err);
      res.status(500).json({ err: err });
    }
  }
);


// UPDATE USER [ADMIN]
router.put(
  "/:id", // params
  admin,
  body("email").isEmail().withMessage("please enter a valid email!"),
  body("name")
    .isString()
    .withMessage("please enter a valid name")
    .isLength({ min: 10, max: 20 })
    .withMessage("name should be between (10-20) character"),
  body("password")
    .isLength({ min: 8, max: 12 })
    .withMessage("password should be between (8-12) character"),
  body("phone").isMobilePhone()
    .withMessage("please enter a valid phoneNumber"),
  async (req, res) => {
    try {
      // 1- VALIDATION REQUEST 
      const query = util.promisify(conn.query).bind(conn);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 2- CHECK IF USER EXISTS OR NOT
      const users = await query("select * from users where id = ?", [
        req.params.id,
      ]);
      if (!users[0]) {
        res.status(404).json({ ms: "user not found !" });
      }

      // 3- PREPARE USER OBJECT
      const userData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        status:'active',
        password: await bcrypt.hash(req.body.password, 10),
        token: crypto.randomBytes(16).toString("hex"), // JSON WEB TOKEN, CRYPTO -> RANDOM ENCRYPTION STANDARD
      };

      // 4- UPDATE USER
      await query("update users set ? where id = ?", [userData, users[0].id]);

      res.status(200).json({
        msg: "user updated successfully",
      });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// DELETE USER [ADMIN]
router.delete(
  "/:id", // params
  admin,
  async (req, res) => {
    try {
      // 1- CHECK IF users EXISTS OR NOT
      const query = util.promisify(conn.query).bind(conn);
      const users = await query("select * from users where id = ?", [
        req.params.id,
      ]);
      if (!users[0]) {
        res.status(404).json({ ms: "user not found !" });
        return;
      }
      await query("delete from users where id = ?", [users[0].id]);
      res.status(200).json({
        msg: "user delete successfully",
      });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

// LIST & SEARCH [ADMIN, USER]
router.get("", admin,async (req, res) => {
  const query = util.promisify(conn.query).bind(conn);
  let search = "";
  if (req.query.search) {
    // QUERY PARAMS
    search = `where name LIKE '%${req.query.search}%'`;
  }
  const users = await query(`select * from users ${search}`);
  res.status(200).json(users);
});

// SHOW USER [ADMIN, USER]
router.get("/:id", admin,async (req, res) => {
  const query = util.promisify(conn.query).bind(conn);
  const users = await query("select * from users where id = ?", [
    req.params.id,
  ]);
  if (!users[0]) {
    res.status(404).json({ ms: "user not found !" });
  }
  res.status(200).json(users[0]);
});

module.exports = router;
