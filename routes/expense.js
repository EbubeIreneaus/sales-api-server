var express = require("express");
const authenticate = require("../authentication");
const Joi = require("joi");
const router = express.Router();

const expenseSchema = Joi.object({
  category: Joi.string().required().lowercase().trim(),
  amount: Joi.number().required(),
  desc: Joi.string().required(),
  userId: Joi.number().integer().required(),
});
const { Expenses, Users, Notifications } = require("../models");
const admin_authentication = require("../admin_authentication");

router.put(
  "/",
  [admin_authentication],

  (req, res, next) => {
    const userId = req.user.id;
    const body = { ...req.body, userId };

    const { error, value } = expenseSchema.validate(body);
    if (error) {
      return res
        .status(422)
        .json({ status: false, msg: error.details[0].message });
    }
    req.body = value;
    next();
  },

  async (req, res) => {
    try {
      const expense = await Expenses.create(req.body);
      const nt = Notifications.build({
        desc: `${req.user.username.toUpperCase()} recorded an expense worth NGN${req.body.amount}, expense ID ${expense.id}`,
        title: 'New Expense',
        onlyAdmin: true
      });

      if (expense) {
        await nt.save() //save notification to database
        req.wsClients.forEach((cl) => {
          cl.send(
            JSON.stringify({ msg: "new_expense", data: expense })
          );
        });
        req.adminWsClients.forEach(cl => {
          cl.send(JSON.stringify({msg: 'notification', data: nt}))
        })
        return res.status(201).json({ status: true });
      }
      return res
        .status(401)
        .json({ status: false, msg: "Error recording expenses." });
    } catch (error) {
      return res.status(500).json({ status: false, msg: error.message });
    }
  }
);

// get all expenses
router.get("/all", async (req, res) => {
  try {
    const expenses = await Expenses.findAll({
      attributes: {
        exclude: ["userId", "UserId"],
      },
      include: {
        model: Users,
        as: 'user',
        attributes: ['username', 'firstname', 'lastname', 'staff', 'admin', 'active']
      }
    });
    if (expenses) {
      return res.status(200).json({ status: true, data: expenses });
    }
    return res.status(404).json({ status: false, msg: "expenses not found" });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
});

module.exports = router;
