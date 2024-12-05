const conn = require("./db");
var { Users } = require("./models");
var { Op } = require("sequelize");

async function authenticate(req, res, next) {

  try {
    
    const authkey = req.cookies.authKey

    const user = await Users.findOne({

      where: { auth_key: authkey },

      attributes: { exclude: ["psw", "auth_key"] },

    });

    if (user) {

      req.user = user;
      console.log(user);
      
      next();

    } else {

      return res
        .status(422)
        .json({ status: false, msg: "could not authenticate this user" });
    }

  } catch (error) {

    return res
      .status(422)
      .json({ status: false, msg: "could not authenticate this user" });
  }

}

module.exports = authenticate;
