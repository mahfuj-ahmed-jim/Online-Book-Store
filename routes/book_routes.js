const BookController = require("../controllers/book_controller");
const express = require("express");
const router = express.Router();

router.get("/all", BookController.getAllBooks);
router.get("/", BookController.getBookById);
router.post("/add", BookController.addNewBook);
router.post("/update", BookController.updateBook);

module.exports = router;