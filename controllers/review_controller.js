const BookModel = require("../models/book_model");
const ReviewModel = require("../models/review_model");
const TransactionModel = require("../models/transaction_model");
const UserModel = require("../models/user_model");
const { sendResponse } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

class ReviewController {
    async addReview(req, res) {
        try {
            const requestBody = req.body;
            const decodedToken = decodeToken(req);
            const userId = decodedToken.user.id;

            const user = await UserModel.findOne({ _id: userId });
            if (!user) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_REVIEW,
                    RESPONSE_MESSAGE.USER_NOT_FOUND
                );
            }

            const book = await BookModel.findOne({ _id: requestBody.book });
            if (!book) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_REVIEW,
                    RESPONSE_MESSAGE.BOOK_DONT_EXISTS
                );
            }

            const existingReview = await ReviewModel.findOne({ user: userId, book: book._id });
            if (existingReview) {
                return sendResponse(
                    res,
                    STATUS_CODE.CONFLICT,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_REVIEW,
                    RESPONSE_MESSAGE.REVIEW_EXISTS
                );
            }

            const review = {
                user: userId,
                book: book._id,
                rating: requestBody.rating,
                comment: requestBody.comment,
            }

            const createdReview = await ReviewModel.create(review);
            if (!createdReview) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_REVIEW,
                    STATUS_RESPONSE.INTERNAL_SERVER_ERROR
                );
            }

            return sendResponse(
                res,
                STATUS_CODE.CREATED,
                RESPONSE_MESSAGE.ADD_REVIEW,
                createdReview
            );
        } catch (err) {
            console.error(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_ADD_REVIEW,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async editReview(req, res) {
        try {
            const requestBody = req.body;
            const decodedToken = decodeToken(req);
            const userId = decodedToken.user.id;

            const user = await UserModel.findOne({ _id: userId });
            if (!user) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_UPDATE_REVIEW,
                    RESPONSE_MESSAGE.USER_NOT_FOUND
                );
            }

            const existingReview = await ReviewModel.findOne({ _id: requestBody.reviewId });
            if (!existingReview) {
                return sendResponse(
                    res,
                    STATUS_CODE.CONFLICT,
                    RESPONSE_MESSAGE.FAILED_TO_UPDATE_REVIEW,
                    RESPONSE_MESSAGE.REVIEW_DONT_EXISTS
                );
            }

            existingReview.comment = requestBody.comment;
            existingReview.rating = requestBody.rating;
            existingReview.time = new Date();

            await existingReview.save();

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.UPDATE_REVIEW,
                existingReview
            );

        } catch (err) {
            console.error(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_UPDATE_REVIEW,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deleteReview(req, res) {
        try {
            const reviewId = req.params.id;
            const decodedToken = decodeToken(req);
            const userId = decodedToken.user.id;

            const user = await UserModel.findOne({ _id: userId });
            if (!user) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_DELETE_REVIEW,
                    RESPONSE_MESSAGE.USER_NOT_FOUND
                );
            }

            const existingReview = await ReviewModel.findOneAndDelete({ _id: reviewId });
            if (!existingReview) {
                return sendResponse(
                    res,
                    STATUS_CODE.CONFLICT,
                    RESPONSE_MESSAGE.FAILED_TO_DELETE_REVIEW,
                    RESPONSE_MESSAGE.REVIEW_DONT_EXISTS
                );
            }

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.DELETE_REVIEW
            );

        } catch (err) {
            console.error(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_DELETE_REVIEW,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }
}

module.exports = new ReviewController();