const BookController = require("../controllers/book_controller");
const express = require("express");
const router = express.Router();

router.get("/all", BookController.getAllBooks);
router.post("/add", BookController.addNewBook);

module.exports = router;