const CartController = require("../controllers/cart_controller");
const express = require("express");
const router = express.Router();

router.patch("/add", CartController.addBookToCart);
router.patch("/remove", CartController.removeBookToCart);

module.exports = router;