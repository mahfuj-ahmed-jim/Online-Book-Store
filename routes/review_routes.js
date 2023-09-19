const ReviewController = require("../controllers/review_controller");
const { validateToken } = require("../middleware/token_validation");
const { validateReviewData, validateUpdateReviewData } = require("../middleware/review_validation");
const express = require("express");
const router = express.Router();

router.post("/add", validateToken, validateReviewData, ReviewController.addReview);
router.put("/update", validateToken, validateUpdateReviewData, ReviewController.editReview);
router.delete("/delete/:id", validateToken, ReviewController.deleteReview);

module.exports = router;