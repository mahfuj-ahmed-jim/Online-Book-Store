const BookModel = require("../models/book_model");
const AuthorModel = require("../models/author_model");
const UserModel = require("../models/user_model");
const { sendResponse } = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

class BookController {
    async getAllBooks(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const books = await BookModel.find(
                { disable: false },
                { summary: false, createdAt: false, updatedAt: false, __v: false, disable: false }
            ).skip((page - 1) * limit)
                .limit(limit)
                .populate('author', '_id name country')
                .exec();

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.GET_ALL_BOOKS,
                books
            );
        } catch (err) {
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
                STATUS_REPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getBookById(req, res) {
        try {
            const bookId = req.query.id;

            const books = await BookModel.findOne(
                { _id: bookId, disable: false },
                { createdAt: false, updatedAt: false, __v: false, disable: false }
            ).populate('author', '_id name about country').exec();

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.GET_BOOK,
                books
            );
        } catch (err) {
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_SIGNUP,
                STATUS_REPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async addNewBook(req, res) {
        try {
            const response = req.body;

            const book = await BookModel.findOne({ ISBN: response.ISBN });
            if (book) {
                return sendResponse(
                    res,
                    STATUS_CODE.CONFLICT,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_BOOK,
                    RESPONSE_MESSAGE.BOOK_EXISTS
                );
            }

            const author = await AuthorModel.findOne({ _id: response.author });
            if (!author) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_BOOK,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_AUTHOR
                );
            }

            const createdBook = await BookModel.create(response);
            if (!createdBook) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_BOOK,
                    STATUS_REPONSE.INTERNAL_SERVER_ERROR
                );
            }

            return sendResponse(
                res,
                STATUS_CODE.CREATED,
                RESPONSE_MESSAGE.BOOK_ADDED,
                createdBook
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_ADD_BOOK,
                STATUS_REPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }
}

module.exports = new BookController();