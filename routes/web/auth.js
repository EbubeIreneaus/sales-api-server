require("dotenv").config();
const express = require("express");
const router = express.Router();
var Joi = require("joi");
var bcrypt = require("bcryptjs");
var { v4: uuid4 } = require("uuid");
var jwt = require("jsonwebtoken");

const { Users } = require("../../models");
const { Op } = require("sequelize");

const SignupSchema = Joi.object({
  firstname: Joi.string().alphanum().lowercase().required(),
  lastname: Joi.string().required().lowercase(),
  email: Joi.string().email().required(),
  psw: Joi.string().min(6),
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim(),
  psw: Joi.string().min(6),
  remember_me: Joi.boolean(),
});

const jwt_secret = process.env.JSON_WEB_SECRET;

router.put(
  "/register",
  (req, res, next) => {
    const { error, value } = SignupSchema.validate(req.body);
    if (error) {
      return res
        .status(422)
        .json({ success: false, msg: error.details[0].message });
    }
    req.body = value;
    next();
  },
  async (req, res) => {
    try {
      const { psw } = req.body;

      const salt = await bcrypt.genSalt(10);
      let hashPsw = await bcrypt.hash(psw, salt);

      const user = await Users.create({
        ...req.body,
        psw: hashPsw,
        auth_key: uuid4(),
      });

      const token = jwt.sign({ userId: user.id }, jwt_secret, {
        expiresIn: "12h",
      });

      if (user) {
        const { firstname, lastname, email } = user;
        return res
          .status(201)
          .json({ success: true, user: { firstname, lastname, email }, token });
      }
      
      return res
        .status(400)
        .json({ success: false, msg: "unknown error occured" });
    } catch (error) {
      return res.status(400).json({ success: false, msg: error.message });
    }
  }
);

// signing user
router.post(
  "/login",
  (req, res, next) => {
    const { body } = req;

    const { error, value } = loginSchema.validate(body);
    if (!error) {
      req.body = value;
      next();
    } else {
      return res
        .status(422)
        .json({ success: false, msg: error.details[0].message });
    }
  },
  async (req, res) => {
    const { email: username, psw: unhashed_password, remember_me } = req.body;

    try {
      const user = await Users.findOne({
        where: { email: username },
        attributes: ["email", "firstname", "lastname", "active", "psw", "id"],
      });

      if (!user) {
        res
          .status(404)
          .json({ success: false, msg: "no such user found on this server" });
      }

      const { psw: hashed_password, active } = user;

      const is_valid_password = await bcrypt.compare(
        unhashed_password,
        hashed_password
      );

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

      const { firstname, lastname, email, id } = user;

      const token = jwt.sign({ userId: id }, jwt_secret, {
        expiresIn: remember_me ? "30d" : "12h",
      });

      return res
        .status(200)
        .json({
          success: true,
          token: token,
          user: { firstname, lastname, email },
        });
    } catch (error) {
      res.status(500).json({
        success: false,
        msg: error.message,
      });
    }
  }
);

module.exports = router;
