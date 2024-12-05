const express = require("express");
const router = express.Router();
var Joi = require("joi");

const { Products, Ratings, Rating, sequelize } = require("../../models");
const { Op } = require("sequelize");

const filterProductQuerySchema = Joi.object({
  minAmount: Joi.number(),
  maxAmount: Joi.number(),
  cats: Joi.string(),
  sizes: Joi.string(),
});

router.get("/featured", async (req, res) => {
  const { offset, limit } = req.query;
  console.log(limit);

  try {
    const products = await Products.findAll({
      where: {
        store: true,
      },

      include: [
        {
          model: Ratings,
          as: "ratings",
          // attributes: [[sequelize.fn('COUNT', sequelize.col('rate')), 'count']]
        },
        {
          model: Rating,
          as: "rating",
          attributes: ["rate", "count"],
        },
      ],
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || 24,
    });

    if (products) {
      return res.status(200).json({ success: true, data: products });
    }
    return res
      .status(404)
      .json({ success: false, msg: "could not fetch product, unknown error" });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
});

router.get("/latest", async (req, res) => {
  const { offset, limit } = req.query;

  try {
    const products = await Products.findAll({
      where: {
        store: true,
      },

      include: [
        {
          model: Rating,
          as: "rating",
          attributes: ["rate", "count"],
        },
      ],
      order: [["id", "DESC"]],
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || 0,
    });

    if (products) {
      return res.status(200).json({ success: true, data: products });
    }
    return res
      .status(404)
      .json({ success: false, msg: "could not fetch product, unknown error" });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
});

router.get("/rated", async (req, res) => {
  const { offset, limit } = req.query;

  try {
    const products = await Products.findAll({
      where: {
        store: true,
      },

      include: [
        {
          model: Rating,
          as: "rating",
          attributes: ["rate", "count"],
        },
      ],
      order: [[{ model: Rating, as: "rating" }, "rate", "DESC"]],
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || 24,
    });

    if (products) {
      return res.status(200).json({ success: true, data: products });
    }
    return res
      .status(404)
      .json({ success: false, msg: "could not fetch product, unknown error" });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
});

router.get(
  "/shopFilters",
  (req, res, next) => {
    const { error, value } = filterProductQuerySchema.validate(req.query);

    if (error) {
      return res
        .status(422)
        .json({ status: false, msg: error.details[0].message });
    }

    req.query = value;
    next();
  },

  async (req, res) => {
    const { offset, limit, cats, sizes, minAmount, maxAmount } = req.query;
    const categories = cats?.toLowerCase().split(",") || null;
    const size = sizes?.toUpperCase().split(",") || null;
    console.log(req.query);

    const queryConditions = {
      store: true,
      market_price: {
        [Op.between]: [
          parseInt(minAmount) || 0,
          parseInt(maxAmount) || Infinity,
        ],
      },
    };

    if (categories && categories.length > 0) {
      queryConditions.sub_category = {
        [Op.in]: categories,
      };
    }

    // if(size.length > 0){
    //   queryConditions.size = {
    //     [Op.in]: size
    //   }
    // }

    try {
      const products = await Products.findAll({
        where: queryConditions,
        include: [
          {
            model: Ratings,
            as: "ratings",
            // attributes: [[sequelize.fn('COUNT', sequelize.col('rate')), 'count']]
          },
          {
            model: Rating,
            as: "rating",
            attributes: ["rate", "count"],
          },
        ],
        offset: parseInt(offset) || 0,
        limit: parseInt(limit) || 72,
      });

      if (products) {
        return res.status(200).json({ success: true, data: products });
      }
      return res.status(404).json({
        success: false,
        msg: "could not fetch product, unknown error",
      });
    } catch (error) {
      return res.status(500).json({ success: false, msg: error.message });
    }
  }
);

router.get(
  "/single",
  (req, res, next) => {
    const { id } = req.query;
    if (isNaN(parseInt(id))) {
      return res
        .status(422)
        .json({ status: false, msg: error.details[0].message });
    }

    req.query.id = parseInt(id);
    next();
  },

  async (req, res) => {
    const { id } = req.query;

    console.log(req.query);


    try {
      const product = await Products.findOne({
        where: {id},
        include: [
          {
            model: Ratings,
            as: "ratings",
            // attributes: [[sequelize.fn('COUNT', sequelize.col('rate')), 'count']]
          },
          {
            model: Rating,
            as: "rating",
            attributes: ["rate", "count"],
          },
        ],
      });

      if (product) {
        return res.status(200).json({ success: true, product });
      }
      return res.status(404).json({
        success: false,
        msg: "could not fetch product, unknown error",
      });
    } catch (error) {
      return res.status(500).json({ success: false, msg: error.message });
    }
  }
);

// router.get("/rating", async (req, res) => {
//   try {
//     const products = await Products.findAll();

//     if (products.length > 1) {
//       for (const product of products) {
//         await product.createRating();
//       }

//       // return res.status(200).json({success: true, products: products[0]});
//     }
//     res.status(200).json({success: true});
//   } catch (error) {
//     res.status(500).json({success:false, msg: error.message});
//   }
// });

module.exports = router;
