require("dotenv").config();
const express = require("express");
const router = express.Router();
const Flutterwave = require("flutterwave-node-v3");
var Joi = require("joi");

const {
  Sales,
  Sold_Products,
  Addresses,
  Products,
  sequelize,
} = require("../../models");
const authenticate = require("../../authentication");

const saleProductSchema = Joi.object({
  productId: Joi.number().integer().required(),
  amount: Joi.number().required(),
  quantity: Joi.number().integer().required(),
});

const saleProductsSchema = Joi.array().items(saleProductSchema);
const addressSchema = Joi.object({
  state: Joi.string().required().lowercase(),
  city: Joi.string().allow("-").required().lowercase(),
  address1: Joi.string().allow("-").required().lowercase(),
  address2: Joi.string().allow("-").allow(null).lowercase(),
  phone1: Joi.number().integer().required(),
  phone2: Joi.number().allow(null),
});

router.put(
  "/createOrder",
  authenticate,
  //validate data
  (req, res, next) => {
    const { products, address, payOption, totalAmount } = req.body;

    const { error: productError, value: productValue } =
      saleProductsSchema.validate(products);
    if (productError) {
      return res
        .status(422)
        .json({ success: false, msg: productError.details[0].message });
    }

    const { error: addressError, value: addressValue } =
      addressSchema.validate(address);

    if (addressError) {
      return res
        .status(422)
        .json({ success: false, msg: addressError.details[0].message });
    }

    req.body = {
      products: JSON.stringify(productValue),
      address: addressValue,
      payOption,
      totalAmount,
    };

    next();
  },
  // generate salesId
  (req, res, next) => {
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
  },
  // handle request
  async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const sale = await Sales.create(
        { salesId: req.salesId, website: true, userId: req.user.id },
        { transaction: t }
      );
      let reqProducts = JSON.parse(req.body.products);

      for (const product of reqProducts) {
        await sale.createSold_product({ ...product }, { transaction: t });
      }
      await sale.createAddress({ ...req.body.address }, { transaction: t });

      // get flutterwave payment link
      const fluterApiRes = await fetch(
        "https://api.flutterwave.com/v3/payments",
        {
          method: "post",
          body: JSON.stringify({
            tx_ref: req.salesId,
            amount: req.body.totalAmount,
            currency: "NGN",
            redirect_url: process.env.ENVIROMENT
              ? "http://localhost:9150/paySuccess"
              : "https://f-store-demo.netlify.app/paySuccess",
            customer: {
              email: req.user.email,
              name: req.user.firstname + " " + req.user.lastname,
              phonenumber: req.body.address.phone1,
            },
            customizations: {
              title: "Ireneaus Fashion Store",
              logo: "https://f-store-demo.netlify.app/img/logo/1.png",
            },
          }),
          headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      let fluterRes = await fluterApiRes.json();

      if (!fluterRes.status == "success") {
        t.rollback();
        return res
          .status(500)
          .json({ success: false, msg: "Card Payment Method Failed." });
      }
      flutterLink = fluterRes.data.link;
      // xxxxxxxxxx end get flutterwave payment link xxxxxx

      t.commit();
      res.status(201).json({ success: true, sale, payLink: flutterLink });
    } catch (error) {
      t.rollback();
      res.status(500).json({ success: false, msg: error.message });
    }
  }
);

router.post("/updatePayment", async (req, res) => {
  try {
    const flw = new Flutterwave(
      process.env.FLW_PUBLIC_KEY,
      process.env.FLW_SECRET_KEY
    );

    let Sale = await Sales.findOne({
      where: { salesId: req.body.salesId },
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

    if (!Sale) {
      return res.status(422).json({
        success: false,
        msg: "order matching details not found on our server",
      });
    }

    // Sale.amount returning undefined
    // Jsonifying it worked for me

    let sale = JSON.stringify(Sale);
    sale = JSON.parse(sale);

    flw.Transaction.verify({ id: parseInt(req.body.transaction_id) })
      .then(async (response) => {
        if (
          response.data.status === "successful" &&
          response.data.amount >= sale.amount &&
          response.data.currency === "NGN" &&
          response.data.tx_ref == sale.salesId
        ) {
          await Sale.update({ paid: true });
          return res.status(200).json({ success: true });
        } else {
          return res.status(400).json({
            success: false,
            msg: "Payment matching details not found",
            res: response,
            sale: sale,
          });
        }
      })
      .catch((err) => {
        return res.status(400).json({ success: false, msg: err.message });
      });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
});

router.get("/orders", authenticate, async (req, res) => {
  const userId = req.user.id;

  try {
    const sale = await Sales.findAll({
      where: {
        userId: userId,
      },
      attributes: {
        exclude: ["UserId"],
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
      },
    });
    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

router.get("/orderDetails", async (req, res) => {
  const { salesId } = req.query;
  try {
    const sale = await Sales.findOne({
      where: { salesId: parseInt(salesId) },
      attributes: {
        exclude: ["userId", "UserId"],
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
      },
      include: [
        {
          model: Sold_Products,
          as: "sold_products",
          attributes: ["quantity", "amount"],
          include: [
            {
              model: Products,
              as: "product",
              attributes: ["id", "market_price", "name", "long_title"],
            },
          ],
        },
      ],
    });
    return res.status(200).json({ success: true, data: sale });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
});

module.exports = router;
