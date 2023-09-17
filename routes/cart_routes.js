const CartController = require("../controllers/cart_controller");
const express = require("express");
const router = express.Router();

router.post("/add", CartController.addBookToCart);

module.exports = router;