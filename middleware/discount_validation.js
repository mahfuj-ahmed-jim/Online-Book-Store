const { sendResponse } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const mongoose = require("mongoose");

const validateDiscountData = (req, res, next) => {
    const { type, discountPercentage, discountAmount, validFrom, validTo, books, authors } = req.body;
    const errors = {};

    const decodedToken = decodeToken(req);
    if (decodedToken.role !== "admin" && !decodedToken.admin.superAdmin) {
        return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            STATUS_REPONSE.UNAUTHORIZED,
            RESPONSE_MESSAGE.UNAUTHORIZED
        );
    }

    if (type !== 1 && type !== 2) {
        errors.type = "Type must be either 1 or 2";
    }

    if (!validFrom || !validTo) {
        errors.validDate = "Both validFrom and validTo are required";
    } else {
        const from = new Date(validFrom);
        const to = new Date(validTo);

        if (isNaN(from) || isNaN(to) || from >= to) {
            errors.validDate = "Invalid date range";
        }
    }

    if (
        (typeof discountPercentage !== "number" || discountPercentage <= 0 || discountPercentage > 100) &&
        (typeof discountAmount !== "number" || discountAmount <= 0)
    ) {
        errors.discount = "Either valid discountPercentage or valid discountAmount is required";
    } else if (typeof discountPercentage === "number" && typeof discountAmount === "number") {
        errors.discount = "Both discountPercentage and discountAmount cannot be specified at the same time";
    }

    if (type === 1) {
        if (!Array.isArray(books) || books.length === 0) {
            errors.books = "For type 1, books must be a non-empty array of book IDs";
        }
        if (authors && authors.length > 0) {
            errors.authors = "For type 1, authors should not exist or should be an empty array";
        }
    } else if (type === 2) {
        if (!Array.isArray(authors) || authors.length === 0) {
            errors.authors = "For type 2, authors must be a non-empty array of author IDs";
        }
        if (books && books.length > 0) {
            errors.books = "For type 2, books should not exist or should be an empty array";
        }
    }

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_SIGNUP, errors);
    }

    next();
}

module.exports = { validateDiscountData };