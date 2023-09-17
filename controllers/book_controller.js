const AuthorModel = require("../models/author_model");
const BookModel = require("../models/book_model");
const DiscountModel = require("../models/discount_model");
const { sendResponse } = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

class BookController {
    async getAllBooks(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            let bookIds = [];
            let authorIds = [];
            let uniqueAuthors = new Set();

            let books = await BookModel.find(
                { disable: false },
                { summary: false, createdAt: false, updatedAt: false, __v: false, disable: false }
            ).skip((page - 1) * limit)
                .limit(limit)
                .populate('author', '_id name country')
                .exec();

            books.map(book => {
                bookIds.push(book._id);
                uniqueAuthors.add(book.author._id);
            });
            authorIds = Array.from(uniqueAuthors);

            const discountQuery = {
                $or: [
                    { books: { $in: bookIds } },
                    { authors: { $in: authorIds } },
                ],
            };

            const discounts = await DiscountModel.find(discountQuery);

            const booksWithDiscounts = books.map((book) => {
                const discount = discounts.find((discount) => {
                    return (
                        discount.books.includes(book._id) ||
                        discount.authors.includes(book.author._id)
                    );
                });

                if (discount) {
                    if (discount.discountPercentage) {
                        const discountPrice = (book.price / 100) * discount.discountPercentage;
                        return { ...book.toObject(), discountPrice: book.price - discountPrice };
                    } else if (discount.discountAmount) {
                        return { ...book.toObject(), discountPrice: book.price - discount.discountAmount };
                    }
                } else {
                    return book;
                }
            });

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.GET_ALL_BOOKS,
                booksWithDiscounts
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_GET_BOOKS,
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
                RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_BOOK,
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

    async editBook(req, res) {
        try {
            const response = req.body;

            const book = await BookModel.findOne({ _id: response.bookId });
            if (!book) {
                return sendResponse(
                    res,
                    STATUS_CODE.CONFLICT,
                    RESPONSE_MESSAGE.FAILED_TO_UPDATE_BOOK,
                    RESPONSE_MESSAGE.BOOK_DONT_EXISTS
                );
            }

            if (response.author) {
                const author = await AuthorModel.findOne({ _id: response.author });
                if (!author) {
                    return sendResponse(
                        res,
                        STATUS_CODE.NOT_FOUND,
                        RESPONSE_MESSAGE.FAILED_TO_UPDATE_BOOK,
                        RESPONSE_MESSAGE.FAILED_TO_ADD_AUTHOR
                    );
                }
            }

            const updatedBook = await BookModel.findOneAndUpdate(
                { _id: response.bookId },
                { $set: response },
                { new: true }
            );

            if (!updatedBook) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_UPDATE_BOOK,
                    STATUS_REPONSE.INTERNAL_SERVER_ERROR
                );
            }

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.BOOK_UPDATED,
                updatedBook
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_UPDATE_BOOK,
                STATUS_REPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deleteBook(req, res) {
        try {
            const bookId = req.params.id;

            const book = await BookModel.findOne({ _id: bookId });
            if (!book) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_DELETE_BOOK,
                    RESPONSE_MESSAGE.BOOK_DONT_EXISTS
                );
            }

            await BookModel.deleteOne({ _id: bookId });

            return sendResponse(
                res,
                STATUS_CODE.NO_CONTENT,
                RESPONSE_MESSAGE.BOOK_DELETED,
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_DELETE_BOOK,
                STATUS_REPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }
}

module.exports = new BookController();