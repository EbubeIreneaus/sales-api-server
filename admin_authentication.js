const conn = require("./db");
var { Users } = require("./models");
var { Op } = require("sequelize");

async function admin_authentication(req, res, next) {

  try {
    
    const authkey = req.cookies.authKey

    const user = await Users.findOne({

      where: { auth_key: authkey, active: true },

      attributes: { exclude: ["psw", "auth_key"] },

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
      .json({ status: false, msg: "could not authenticate this user "+error.message });
  }

}

module.exports = admin_authentication;
