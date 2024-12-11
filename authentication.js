require('dotenv').config()
const conn = require("./db");
var { Users } = require("./models");
var { Op } = require("sequelize");
const jwt = require('jsonwebtoken')
const jwt_secret = process.env.JSON_WEB_SECRET

async function authenticate(req, res, next) {

  try {
    
    let authkey = req.headers.Authorization || req.headers.authorization
    authkey = authkey.split(' ')[1]
   
    const token = jwt.verify(authkey, jwt_secret)
    const user = await Users.findOne({

      where: { id: token.userId },

      attributes: { exclude: ["psw","auth_key", 'userId'] },

    });
    

    if (user) {
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
      .json({ status: false, msg: "could not authenticate this user"+ error.message});
  }

}

module.exports = authenticate;
