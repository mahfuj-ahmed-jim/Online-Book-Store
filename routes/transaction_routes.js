const TransactionController = require("../controllers/transaction_controller");
const express = require("express");
const router = express.Router();

router.post("/create", TransactionController.createTransaction);

module.exports = router;