const BookController = require("../controllers/book_controller");
const express = require("express");
const router = express.Router();

router.post("/add", BookController.addNewBook);

module.exports = router;