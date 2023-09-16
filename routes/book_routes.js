const BookController = require("../controllers/book_controller");
const express = require("express");
const router = express.Router();

router.get("/all", BookController.getAllBooks);
router.get("/", BookController.getBookById);
router.post("/add", BookController.addNewBook);
router.put("/edit", BookController.editBook);

module.exports = router;