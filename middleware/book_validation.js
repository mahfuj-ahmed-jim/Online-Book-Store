const { sendResponse } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const mongoose = require("mongoose");

const validateBookData = (req, res, next) => {
    const { title, author, price, stock, totalSell, publishedDate, updateDate, edition, ISBN, pageNumber, country, language, genre, summary } = req.body;
    const errors = {};

    const decodedToken = decodeToken(req);
    if (decodedToken.role !== "admin") {
        return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            STATUS_REPONSE.UNAUTHORIZED,
            RESPONSE_MESSAGE.UNAUTHORIZED
        );
    }

    if (!title) {
        errors.title = "Title is required";
    } else if (typeof title !== "string") {
        errors.title = "Title must be a string";
    }

    if (!author) {
        errors.author = "Author is required";
    } else if (typeof author !== "string") {
        errors.author = "Author must be a string";
    } else {
        const isIdValid = mongoose.Types.ObjectId.isValid(author);
        if (!isIdValid) {
            errors.author = "Author is not valid"
        }
    }

    if (!totalSell) {
        errors.totalSell = "Total sell is required.";
    } else if (typeof totalSell !== "number" || totalSell < 1) {
        errors.totalSell = "Total sell must be a number greater than or equal to 1";
    }

    if (!price) {
        errors.price = "Price is required.";
    } else if (typeof price !== "number" || price < 1) {
        errors.price = "Price must be a number greater than or equal to 1";
    }

    if (!stock) {
        errors.stock = "Stock is required.";
    } else if (typeof stock !== "number" || stock < 1) {
        errors.stock = "Stock must be a number greater than or equal to 1";
    }

    if (!pageNumber) {
        errors.pageNumber = "Page number is required.";
    } else if (typeof pageNumber !== "number" || pageNumber < 1) {
        errors.pageNumber = "Page number must be a number greater than or equal to 1";
    }

    if (!edition) {
        errors.edition = "Edition is required";
    } else if (typeof edition !== "number") {
        errors.edition = "Edition must be a number";
    }

    if (!ISBN) {
        errors.ISBN = "ISBN is required";
    } else if (typeof ISBN !== "string") {
        errors.ISBN = "ISBN must be a string";
    }

    if (!country) {
        errors.country = "Country is required";
    } else if (typeof country !== "string") {
        errors.country = "Country must be a string";
    }

    if (!language) {
        errors.language = "Language is required";
    } else if (typeof language !== "string") {
        errors.language = "Language must be a string";
    }

    if (!genre) {
        errors.genre = "Genre is required.";
    } else if (!Array.isArray(genre) || genre.length < 1) {
        errors.genre = "Genre must be an array of at least one string";
    }

    if (!summary) {
        errors.summary = "Summary is required";
    } else if (typeof summary !== "string") {
        errors.summary = "Summary must be a string";
    }


    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_SIGNUP, errors);
    }

    next();
}

const validateUpdateBookData = (req, res, next) => {
    const { bookId, title, author, price, stock, totalSell, publishedDate, updateDate, edition, ISBN, pageNumber, country, language, genre, summary } = req.body;
    const errors = {};

    const decodedToken = decodeToken(req);
    if (decodedToken.role !== "admin") {
        return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            STATUS_REPONSE.UNAUTHORIZED,
            RESPONSE_MESSAGE.UNAUTHORIZED
        );
    }

    if (!bookId || bookId === "") {
        errors.bookId = "Book Id must be a string";
    } else {
        const isIdValid = mongoose.Types.ObjectId.isValid(bookId);
        if (!isIdValid) {
            errors.bookId = "Book id is not valid"
        }
    }

    if (title && typeof title !== "string") {
        errors.title = "Title must be a string";
    }

    if (author && typeof author !== "string") {
        errors.author = "Author must be a string";
    } else if(author){
        const isIdValid = mongoose.Types.ObjectId.isValid(author);
        if (!isIdValid) {
            errors.author = "Author is not valid"
        }
    }

    if (price && typeof price !== "number" || price < 1) {
        errors.price = "Price must be a number greater than or equal to 1";
    }

    if (stock && typeof stock !== "number" || stock < 1) {
        errors.stock = "Stock must be a number greater than or equal to 1";
    }

    if (pageNumber && typeof pageNumber !== "number" || pageNumber < 1) {
        errors.pageNumber = "Page number must be a number greater than or equal to 1";
    }

    if (edition && typeof edition !== "number") {
        errors.edition = "Edition must be a number";
    }

    if (ISBN && typeof ISBN !== "string") {
        errors.ISBN = "ISBN must be a string";
    }

    if (country && typeof country !== "string") {
        errors.country = "Country must be a string";
    }

    if (language && typeof language !== "string") {
        errors.language = "Language must be a string";
    }

    if (genre && (!Array.isArray(genre) || genre.length < 1)) {
        errors.genre = "Genre must be an array of at least one string";
    }

    if (summary && typeof summary !== "string") {
        errors.summary = "Summary must be a string";
    }

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_SIGNUP, errors);
    }

    next();
}

module.exports = { validateBookData, validateUpdateBookData };