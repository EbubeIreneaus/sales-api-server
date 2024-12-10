const express = require("express");
const router = express.Router();
var Joi = require("joi");

const { Users } = require("../../models");
const { Op } = require("sequelize");

router.get("/m", async (req, res) => {
  const { authKey } = req.cookies;
  try {
    const user = await Users.findOne({
      where: { auth_key: authKey },
      attributes: ["firstname", "lastname", "email"],
    });
    if (user) {
      return res.status(200).json({ success: true, user });
    }
    return res.status(404).json({ success: false, msg: "user not found" });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
});

module.exports = router;
