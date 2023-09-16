const AuthorController = require("../controllers/author_controller");
const express = require("express");
const router = express.Router();

router.get("/all", AuthorController.getAllAuthor);
router.post("/add", AuthorController.addNewAuthor);

module.exports = router;