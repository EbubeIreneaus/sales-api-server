const express = require("express");
const router = express.Router();
var Joi = require("joi");

const { Users } = require("../../models");
const { Op } = require("sequelize");
const authenticate = require("../../authentication");

router.get("/m", authenticate, async (req, res) => {
  const { firstname, lastname, email } = req.user;
  return res
    .status(200)
    .json({ success: true, user: { firstname, lastname, email } });
});

module.exports = router;
