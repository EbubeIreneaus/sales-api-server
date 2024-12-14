require('dotenv').config()
const conn = require("./db");
const jwt = require('jsonwebtoken')
var { Users } = require("./models");
var { Op } = require("sequelize");

async function admin_authentication(req, res, next) {

  try {
    
    let authkey = req.headers.Authorization || req.headers.authorization
    authkey = authkey.split(' ')[1]
    const token = jwt.verify(authkey, process.env.JSON_WEB_SECRET)
    const user = await Users.findOne({

      where: { id: token.userId, active: true },

      attributes: { exclude: ["psw", "auth_key", "userId"] },

    });

    if (user && user.admin) {

      req.user = user;
      
      next();

    } else {

      return res
        .status(422)
        .json({ status: false, msg: "could not authenticate this user" });
    }

  } catch (error) {

    return res
      .status(422) 
      .json({ status: false, msg: "could not authenticate this user"});
  }

}

module.exports = admin_authentication;
