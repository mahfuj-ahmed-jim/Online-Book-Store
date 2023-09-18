const TransactionController = require("../controllers/transaction_controller");
const express = require("express");
const router = express.Router();

router.get("/all", TransactionController.getAllTransactions);
router.get("/user/:id", TransactionController.getTransactionsForUser);
router.post("/create", TransactionController.createTransaction);

module.exports = router;