const DiscountController = require("../controllers/discount_controller");
const express = require("express");
const router = express.Router();

router.post("/add", DiscountController.addDiscount);
router.put("/update", DiscountController.updateDiscount);

module.exports = router;