var express = require("express");
var conn = require("../db");
var authenticate = require("../authentication");
var Joi = require("joi");
var router = express.Router();

const {
  Sales,
  sequelize,
  Sold_Products: soldProducts,
  Products,
  Users,
} = require("../models");

// router.use(authenticate);

var productSchema = Joi.object({
  productId: Joi.number().integer().required(),
  amount: Joi.number().required(),
  quantity: Joi.number(),
});

var saleSchema = Joi.object({
  paid: Joi.boolean(),
  cash: Joi.boolean(),
  website: Joi.boolean(),
});

var productsSchema = Joi.array().items(productSchema);

function generateSalesId(req, res, next) {
  async function attemptGenerateId() {

    const randomId = Math.floor(100000 + Math.random() * 9000000); // Generate 6-7 digit random

    let re = await Sales.findOne({ where: { salesId: randomId } });

    if (re) {
      return attemptGenerateId();
    }

    req.salesId = randomId;

    return next();
  }

  attemptGenerateId();
}

// add to sales
router.put(
  "",
  [generateSalesId, authenticate],
  (req, res, next) => {
    const { error: productError, value: productValue } =
      productsSchema.validate(req.body.new_products);
    const { error: saleError, value: saleValue } = saleSchema.validate(
      req.body.sale
    );
    if (productError) {
      return res
        .status(422)
        .json({ status: false, msg: productError.details[0].message });
    }

    if (saleError) {
      return res
        .status(422)
        .json({ status: false, msg: saleError.details[0].message });
    }
    req.body = { products: productValue, sale: saleValue };
    next();
  },
  async (req, res) => {
    const salesId = req.salesId;
    const t = await sequelize.transaction();
    try {
      let sale = await Sales.create(
        { salesId: salesId, ...req.body.sale, userId: req.user.id },
        { transaction: t }
      );

      for (const pd of req.body.products) {
        const sold_product = await soldProducts.create(
          { salesId: sale.salesId, ...pd },
          { transaction: t }
        );
      }
      await t.commit();

      const sales = await Sales.findOne({
        where: {
          salesId: sale.salesId,
        },
        include: [
          {
            model: soldProducts,
            as: "sold_products",
            attributes: { exclude: ["salesId"] },
            include: {
              model: Products,
              attributes: ["name", "unit_price"],
              as: "product",
            },
          },
          {
            model: Users,
            as: "user",
            attributes: ["firstname", "lastname", "username", "admin", "staff"],
          },
        ],
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT SUM(sp.amount) 
                FROM sold_products sp 
                WHERE sp.salesId = Sales.salesId
              )`),
              "amount",
            ],
          ],
          exclude: ["userId", "UserId"],
        },
      });

      req.wsClients.forEach((cl) => {
        cl.send(
          JSON.stringify({
            msg: "new_sales_record",
            sale: sales,
          })
        );
      });
      return res.status(201).json({ status: true });
    } catch (error) {
      res.status(500).json({ status: false, msg: error.message });
      await t.rollback();
    }
  }
);

// get all sales
router.get("/all", async (req, res) => {
  const sales = await Sales.findAll({
    include: [
      {
        model: soldProducts,
        attributes: { exclude: ["salesId"] },
        as: "sold_products",
        include: {
          model: Products,
          attributes: ["name", "unit_price"],
          as: "product",
        },
      },
      {
        model: Users,
        as: "user",
        attributes: ["firstname", "lastname", "username", "admin", "staff"],
      },
    ],
    attributes: {
      include: [
        [
          sequelize.literal(`(
            SELECT SUM(sp.amount) 
            FROM sold_products sp 
            WHERE sp.salesId = Sales.salesId
          )`),
          "amount",
        ],
      ],
      exclude: ["userId", "UserId"],
    },
  });
  if (sales) {
    return res.status(200).json({ status: true, data: sales });
  }
  return res.status(404).json({ status: false, msg: "sales not found" });
});
module.exports = router;
