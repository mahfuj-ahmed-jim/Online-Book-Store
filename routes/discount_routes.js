const DiscountController = require("../controllers/discount_controller");
const express = require("express");
const router = express.Router();

router.post("/add", DiscountController.addDiscount);

module.exports = router;