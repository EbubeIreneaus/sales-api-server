var express = require("express");
const authenticate = require("../authentication");
var { Op } = require("sequelize");
var router = express.Router();

var { Users } = require("../models");
const admin_authentication = require("../admin_authentication");

/* GET users listing. */
router.get("/all", admin_authentication, async (req, res) => {
  const {id: userId} = req.user
  try {
    const users = await Users.findAll({
      where: { id: { [Op.ne]: userId} },
      attributes: { exclude: ["psw", "auth_key", 'userId'] },
    });
    if (users) {
      return res.status(200).json({status: true, users: users, me: req.user})
    }
    return res.status(200).json({status: false, msg: 'No User Found'})
  } catch (error) {
    return res.status(500).json({status: false, msg: error.messge})
  }
});

module.exports = router;
