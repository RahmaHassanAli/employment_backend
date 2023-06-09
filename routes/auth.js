const router = require("express").Router();
const conn = require("../db/dbConnection");
const { body, validationResult } = require("express-validator");
const util = require("util"); // helper
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const authorized = require("../middleware/authorize");

// LOGIN
router.post(
  "/login",
  body("email").isEmail().withMessage("please enter a valid email!"),
  body("password").isLength({ min: 8, max: 12 }).withMessage("password should be between (8-12) character"),
  async (req, res) => {
        try {
          // 1- VALIDATION REQUEST [manual, express validation]
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
          }

      // 2- CHECK IF EMAIL EXISTS
      const query = util.promisify(conn.query).bind(conn); // transform query mysql --> promise to use [await/async]
      const user = await query("select * from users where email = ?", [
        req.body.email,
      ]);
      if (user.length == 0) {
        res.status(404).json({
          errors: [
            {
              msg: "email or password not found !",
            },
          ],
        });
      }

      // 3- COMPARE HASHED PASSWORD
      const checkPassword = await bcrypt.compare(
        req.body.password,
        user[0].password
      );
      if (checkPassword) {
       delete user[0].password;
        res.status(200).json(user[0]);
      } else {
        res.status(404).json({
          errors: [
            {
              msg: "email or password not found !",
            },
          ],
        });
      }
    } catch (err) {
        console.log(err);
      res.status(500).json({ err: err });
    }
  }
);

// REGISTRATION
router.post(
  "/register",
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


//LOG OUT[ADMIN,USER]
router.put(
  "/logout", // params
  authorized,
  async (req, res) => {
    try {
      const query = util.promisify(conn.query).bind(conn);

      // 2- CHECK IF USER EXISTS OR NOT
      const users = await query("select * from users where id = ?", [
        res.locals.user.id,
      ]);
      if (!users[0]) {
        res.status(404).json({ ms: "user not found !" });
        return;
      }

      // 3- PREPARE USER OBJECT
      const UserOject = {
        status:"unactive",
      };
      // 4- UPDATE USER STATUS
      await query("update users set ? where id = ?", [UserOject, users[0].id]);

      res.status(200).json({
        msg: "user log out successfully",
      });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

module.exports = router;
