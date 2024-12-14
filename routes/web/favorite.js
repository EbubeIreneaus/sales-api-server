const express = require("express");
const authenticate = require("../../authentication");
const Joi = require("joi");
const { Favorite, Users, Products } = require("../../models");
const { Op } = require("sequelize");
const router = express.Router();

const favSchema = Joi.object({
  products: Joi.string().required().allow(",").allow("").allow(" "),
});

router.put(
  "/",
  authenticate,

  async (req, res) => {
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(422).json({ success: false, msg: "invalid product" });
      }
      const product = await Products.findOne({
        where: { id: parseInt(productId) },
        attributes: ["id"],
      });

      if (!product) {
        return res
          .status(400)
          .json({ success: false, msg: "product not found" });
      }

      await req.user.createFavorite({ productId: product.id });

      return res
        .status(200)
        .json({ success: true});
    } catch (error) {
      return res.status(500).json({ success: false, msg: error.message });
    }
  }
);

router.get("/products", async (req, res) => {
  const productsIds = req.query.p.toString().split(",");
  try {
    const products = await Products.findAll({
      where: {
        id: {
          [Op.in]: productsIds,
        },
      },
    });

    return res.status(200).json({ data: products });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

router.delete("/", authenticate, async (req, res) => {
  try {
    const { productId } = req.body;

    await Favorite.destroy({
      where: { productId: productId, userId: req.user.id },
    });

    return res
      .status(200)
      .json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
});

router.get("/productIds", authenticate, async (req, res) => {
  try {
    let data = await req.user.getFavorites();
    data = data?.map((dt) => dt.productId);
    res.status(200).json({ data: data });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
