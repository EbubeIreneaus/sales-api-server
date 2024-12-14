var express = require("express");
var router = express.Router();
const authenticate = require("../authentication");
const sanitizeHtml = require("sanitize-html");
var Joi = require("joi");
var conn = require("../db");
var multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/products");
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    cb(null, Date.now() + "." + ext); //Appending .jpg
  },
});

var upload = multer({ storage: storage });

const productSchema = Joi.object({
  name: Joi.string().required().lowercase().trim(),
  quantity: Joi.number().min(1),
  unit_price: Joi.number().min(1),
  market_price: Joi.number().min(1),
  id: Joi.number().integer(),
});

const storeProductSchema = Joi.object({
  id: Joi.number().integer(),
  long_title: Joi.string().allow("", null).alphanum(),
  category: Joi.string().lowercase().trim(),
  sub_category: Joi.string().lowercase().trim(),
  store: Joi.boolean(),
  desc: Joi.string()
    .custom((value, helpers) => {
      const sanitized = sanitizeHtml(value, {
        allowedTags: ["b", "i", "em", "strong", "a", "p", "div"],
        allowedAttributes: {
          a: ["href", "title"],
          "*": ["style"],
        },
      });

      if (!sanitized.trim()) {
        return helpers.error("string.empty", { value });
      }

      return sanitized; // Return the sanitized HTML
    }, "Sanitize HTML")
    .required(),
});

const productsSchema = Joi.array().items(productSchema);

const { Products } = require("../models");
const admin_authentication = require("../admin_authentication");

// router.ws("/ws", (ws, req) => {
//   clients.push(ws);
// });

// add product to db
router.put(
  "/",
  [authenticate],

  (req, res, next) => {
    const { body } = req;
    const { error, value } = productsSchema.validate(body);
    if (error) {
      res.status(422).json({ status: false, msg: error.details[0].message });
    } else {
      req.body = value;
      next();
    }
  },

  async (req, res) => {
    try {
      let data = req.body;
      const products = await Products.bulkCreate(data);

      if (products.length > 0) {
        req.wsClients.forEach((client) => {
          client.send(
            JSON.stringify({ msg: "new_product_added", products: products })
          );
        });

        return res.json({ status: true });
      }

      return res
        .status(500)
        .json({ status: false, msg: "could not insert product.." });
    } catch (error) {
      res.status(500).json({ status: false, msg: error.message });
    }
  }
);

// get all product
router.get("/all", async (req, res) => {
  try {
    const product = await Products.findAll();
    if (product) {
      return res.status(200).json({ status: true, data: product });
    }
    return res.status(404).json({ status: false, msg: "products not found" });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
});

// update image
router.post(
  "/updateImage",
  admin_authentication,
  upload.single("file"),
  async (req, res) => {
    try {
      const { productId } = req.body;
      const product = await Products.findOne({
        where: {
          id: productId,
        },
      });

      if (product) {
        await product.update({ image: req.file.filename });
        req.wsClients.forEach((client) => {
          client.send(
            JSON.stringify({
              msg: "image_updated",
              productId: productId,
              filename: req.file.filename,
            })
          );
        });
        return res
          .status(200)
          .json({ status: true, filename: req.file.filename });
      }
      return res.status(404).json({ status: false, msg: "product not found" });
    } catch (error) {
      return res.status(500).json({ status: false, msg: error.message });
    }
  }
);

// delete a product
router.delete("/", admin_authentication, async (req, res) => {
  const { productId } = req.body;
  try {
    const product = await Products.destroy({
      where: {
        id: productId,
      },
    });
    req.wsClients.forEach((client) => {
      client.send(
        JSON.stringify({ msg: "product_deleted", productId: productId })
      );
    });
    return res.json({ status: true });
  } catch (error) {
    return res.status(500).json({
      status: false,
      msg: "could not delete product, " + error.message,
    });
  }
});

// update a product
router.post(
  "/updateProductData",
  admin_authentication,

  (req, res, next) => {
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      res.status(422).json({ status: false, msg: error.details[0].message });
    } else {
      req.body = value;
      next();
    }
  },

  async (req, res) => {
    const { name, unit_price, quantity, id: productId } = req.body;

    try {
      const product = await Products.findOne({
        where: {
          id: productId,
        },
      });

      if (product) {
        await product.update({ name, unit_price, quantity });
        req.wsClients.forEach((cl) => {
          cl.send(JSON.stringify({ msg: "product_updated", product: product }));
        });
        return res.status(200).json({ status: true });
      }
      return res.status(422).json({
        status: false,
        msg: "uknown error while updating product data.",
      });
    } catch (error) {
      return res.status(500).json({ status: false, msg: error.message });
    }
  }
);

// update product store info
router.post(
  "/updateStore",
  admin_authentication,
  (req, res, next) => {
    const data = req.body;

    const { error, value } = storeProductSchema.validate(data);
    if (error) {
      return res
        .status(422)
        .json({ status: false, msg: error.details[0].message });
    }
    req.body = value;
    next();
  },
  async (req, res) => {
    const data = req.body;
    try {
      const product = await Products.findOne({
        where: {
          id: data.id,
        },
      });

      if (product) {
        await product.update({ ...data });

        req.wsClients.forEach((cl) => {
          cl.send(JSON.stringify({ msg: "product_updated", product: product }));
        });

        return res
        .status(200)
        .json({ status: true, msg: "product updated successfully" });
      }

      return res
        .status(422)
        .json({ status: false, msg: "product not found" });
      
    } catch (error) {
      res.status(500).json({ status: false, msg: error.message });
    }
  }
);

module.exports = router;
