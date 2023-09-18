const ReviewController = require("../controllers/review_controller");
const express = require("express");
const router = express.Router();

router.post("/add", ReviewController.addReview);

module.exports = router;