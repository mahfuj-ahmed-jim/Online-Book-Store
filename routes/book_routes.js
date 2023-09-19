const BookController = require("../controllers/book_controller");
const { validateToken } = require("../middleware/token_validation");
const { validateBookData, validateUpdateBookData } = require("../middleware/book_validation");
const express = require("express");
const router = express.Router();

router.get("/all", BookController.getAllBooks);
router.get("/:id", BookController.getBookById);
router.post("/add", validateToken, validateBookData, BookController.addNewBook);
router.put("/edit", validateToken, validateUpdateBookData, BookController.editBook);
router.delete('/:id', BookController.deleteBook);

module.exports = router;