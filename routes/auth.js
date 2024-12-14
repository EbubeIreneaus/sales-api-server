require("dotenv").config();
const express = require("express");
const router = express.Router();
const conn = require("../db");
const Joi = require("joi");
var bcrypt = require("bcryptjs");
var { v4: uuid4 } = require("uuid");
const authenticate = require("../authentication");
const jwt = require("jsonwebtoken");
var multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/users");
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    cb(null, Date.now() + "." + ext); //Appending .jpg,.png....
  },
});
const upload = multer({ storage: storage });

const jwt_secret = process.env.JSON_WEB_SECRET;

var { Users } = require("../models/index");
const admin_authentication = require("../admin_authentication");

const loginSchema = Joi.object({
  username: Joi.string().alphanum().required().trim(),
  password: Joi.string().min(6),
});

const staffSignupSchema = Joi.object({
  firstname: Joi.string().alphanum().lowercase().required(),
  lastname: Joi.string().required().lowercase(),
  username: Joi.string().alphanum().required().lowercase().trim(),
  email: Joi.string().email().required(),
  admin: Joi.boolean(),
  staff: Joi.boolean(),
});

const pswSchema = Joi.object({
  old_pass: Joi.string().min(6).required(),
  password: Joi.string().min(6).required(),
});

function generatePass() {
  let pass = "";
  let str =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz0123456789@#$";

  for (let i = 1; i <= 14; i++) {
    let char = Math.floor(Math.random() * str.length + 1);

    pass += str.charAt(char);
  }

  return pass;
}

// signing user
router.post(
  "/",
  (req, res, next) => {
    const { body } = req;

    const { error, value } = loginSchema.validate(body);
    if (!error) {
      req.body = value;
      next();
    } else {
      return res.send({ success: false, msg: error.details[0].message });
    }
  },
  async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await Users.findOne({
        where: { username: username },
        attributes: ["id", "psw", "active", "admin", "username"],
      });

      if (!user) {
        res
          .status(404)
          .json({ success: false, msg: "no such user found on this server" });
      }

      const { psw, active } = user;

      const is_valid_password = await bcrypt.compare(password, psw);

      if (!is_valid_password) {
        return res
          .status(404)
          .json({ success: false, msg: "Incorrect password for this user" });
      }

      if (!active) {
        return res
          .status(200)
          .json({ success: false, msg: "this user have no access." });
      }

      const token = jwt.sign({ userId: user.id }, jwt_secret, {
        expiresIn: "12h",
      });

      return res.status(200).json({ success: true, token: token });
    } catch (error) {
      res.status(500).json({
        success: false,
        msg: error.message,
      });
    }
  }
);

router.put(
  "/",

  admin_authentication,

  (req, res, next) => {
    const { body } = req;
    const { error, value } = staffSignupSchema.validate(body);
    if (!error) {
      req.body = value;
      next();
    } else {
      res.status(422).json({ status: false, msg: error.details[0].message });
    }
  },

  async (req, res) => {
    try {
      let psw = "178420443";

      const salt = await bcrypt.genSalt(10);

      let hashPsw = await bcrypt.hash(psw, salt);

      const user = await Users.create({ ...req.body, psw: hashPsw });

      if (user) {
        return res
          .status(201)
          .json({ status: true, msg: "user created successfully" });
      }

      return res
        .status(422)
        .json({ status: false, msg: "error creating user " + err });
    } catch (error) {
      res.status(422).json({ status: false, msg: error.message });
    }
  }
);

router.get("/", admin_authentication, async (req, res) => {
  try {
    const user = await Users.findByPk(req.user.id, {
      attributes: {
        exclude: ["psw", "auth_key", "userId"],
      },
    });

    if (user) {
      return res.status(200).json({ status: true, data: user });
    }
    return res.status(422).json({ status: false, msg: "user not found" });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
});

// update profile pics
router.post(
  "/updateProfilepics",
  admin_authentication,
  upload.single("profile_pics"),
  async (req, res) => {
    try {
      await req.user.update({ profile_pics: req.file.filename });
      return res.status(200).json({ status: true });

      res.status(400).json({ status: false, msg: "user not found" });
    } catch (error) {
      console.log(error.message);

      res.status(500).json({ status: false, msg: error.message });
    }
  }
);

router.post(
  "/update/psw",
  admin_authentication,
  (req, res, next) => {
    const { error } = pswSchema.validate(req.body);
    if (error) {
      return res
        .status(422)
        .json({ status: false, msg: error.details[0].message });
    }
    next();
  },
  async (req, res) => {
    try {
      const { old_pass, password } = req.body;
      const user = await Users.findByPk(req.user.id);
      if (await bcrypt.compare(old_pass, user.psw)) {
        const salt = await bcrypt.genSalt(10);
        const new_psw = await bcrypt.hash(password, salt);
        await user.update({ psw: new_psw });
        return res.status(200).json({ status: true });
      }
      return res
        .status(422)
        .json({ status: false, msg: "Incorrect Existing password" });
    } catch (error) {
      res.status(500).json({ status: false, msg: error.message });
    }
  }
);

// make user an admin
router.post(
  "/makeAdmin",
  [admin_authentication],
  (req, res, next) => {
    if (req.user.admin) {
      next();
    } else {
      res
        .status(422)
        .json({ status: false, msg: "you cannot perform this task.." });
    }
  },
  async (req, res) => {
    const { staffId } = req.body;
    try {
      const staff = await Users.findOne({
        where: { id: staffId },
        attributes: {exclude: ['userId', 'psw', 'auth_key']}
      });
      if (staff) {
        if (!staff.admin) {
          await staff.update({ admin: true });
        }
        return res.status(200).json({ status: true });
      }
      return res.status(400).json({ status: false, msg: "no user was found" });
    } catch (error) {
      return res.status(400).json({ status: false, msg: error.message });
    }
  }
);

// remove admin
router.post(
  "/removeAdmin",
  [admin_authentication],
  (req, res, next) => {
    if (req.user.admin) {
      next();
    } else {
      res
        .status(422)
        .json({ status: false, msg: "you cannot perform this task.." });
    }
  },
  async (req, res) => {
    const { staffId } = req.body;
    try {
      const staff = await Users.findOne({
        where: { id: staffId },
        attributes: {exclude: ['userId', 'psw', 'auth_key']}
      });
      if (staff) {
        if (staff.admin) {
          await staff.update({ admin: false });
        }
        return res.status(200).json({ status: true });
      }
      return res.status(400).json({ status: false, msg: "no user was found" });
    } catch (error) {
      return res.status(400).json({ status: false, msg: error.message });
    }
  }
);

// deactivate user
router.post(
  "/deactivate",
  [admin_authentication],
  (req, res, next) => {
    if (req.user.admin) {
      next();
    } else {
      res
        .status(422)
        .json({ status: false, msg: "you cannot perform this task.." });
    }
  },
  async (req, res) => {
    const { userId } = req.body;
    try {
      const user = await Users.findOne({
        where: { id: userId },
        attributes: {exclude: ['userId', 'psw', 'auth_key']}
      });
      if (user) {
        if (user.active) {
          await user.update({ active: false });
        }
        return res.status(200).json({ status: true });
      }
      return res.status(400).json({ status: false, msg: "no user was found" });
    } catch (error) {
      return res.status(400).json({ status: false, msg: error.message });
    }
  }
);

// reactivate user
router.post(
  "/activate",
  [admin_authentication],
  (req, res, next) => {
    if (req.user.admin) {
      next();
    } else {
      res
        .status(422)
        .json({ status: false, msg: "you cannot perform this task.." });
    }
  },
  async (req, res) => {
    const { userId } = req.body;
    try {
      const user = await Users.findOne({
        where: { id: userId },
        attributes: {exclude: ['userId', 'psw', 'auth_key']}
      });
      if (user) {
        if (!user.active) {
          await user.update({ active: true });
        }
        return res.status(200).json({ status: true });
      }
      return res.status(400).json({ status: false, msg: "no user was found" });
    } catch (error) {
      return res.status(400).json({ status: false, msg: error.message });
    }
  }
);
module.exports = router;
