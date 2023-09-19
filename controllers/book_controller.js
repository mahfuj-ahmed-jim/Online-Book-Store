const AuthorModel = require("../models/author_model");
const BookModel = require("../models/book_model");
const DiscountModel = require("../models/discount_model");
const { sendResponse, discountQuery, countBookDiscount } = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

class BookController {
    async getAllBooks(req, res) {
        try {
            const { sortProperty } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const sortOrder = req.query.sortOrder || "asc";
            const genreFilter = req.query.genreFilter || "";
            const searchKey = req.query.searchKey || "";
            let bookIds = [];
            let authorIds = [];
            let uniqueAuthors = new Set();
            let sortStage = {};

            if (sortProperty) {
                if (sortProperty !== "price" || sortProperty !== "rating" || sortProperty !== "stock" ||
                    sortProperty !== "totalSell" || sortOrder !== "asc" || sortOrder !== "desc") {

                    if (sortOrder === "desc") {
                        sortStage[sortProperty] = -1;
                    } else {
                        sortStage[sortProperty] = 1;
                    }

                } else {
                    return sendResponse(
                        res,
                        STATUS_CODE.UNPROCESSABLE_ENTITY,
                        RESPONSE_MESSAGE.FAILED_TO_GET_BOOKS,
                        RESPONSE_MESSAGE.INVALID_SORT_PROPERTY
                    );
                }
            }

            let books = await BookModel.aggregate([
                {
                    $lookup: {
                        from: "authors",
                        localField: "author",
                        foreignField: "_id",
                        as: "author"
                    }
                },
                {
                    $unwind: "$author"
                },
                {
                    $match: { "author.disable": false, disable: false }
                },
                {
                    $match: { 
                        $or: [
                            { title: { $regex: searchKey, $options: "i" } },
                            { "author.name": { $regex: searchKey, $options: "i" } }
                        ],
                        genre: { $regex: genreFilter, $options: "i" } 
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        price: 1,
                        genre: 1,
                        country: 1,
                        "author._id": 1,
                        "author.name": 1,
                        "author.country": 1
                    }
                },
                {
                    $sort: sortStage
                },
                {
                    $skip: (page - 1) * limit
                },
                {
                    $limit: limit
                }
            ]);

            books.map(book => {
                bookIds.push(book._id);
                uniqueAuthors.add(book.author._id);
            });
            authorIds = Array.from(uniqueAuthors);

            const query = discountQuery(bookIds, authorIds);
            const discounts = await DiscountModel.find(query);
            const booksWithDiscounts = countBookDiscount(books, discounts);

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.GET_ALL_BOOKS,
                {
                    page: page,
                    bookPerPage: limit,
                    totalBooks: booksWithDiscounts.length,
                    books: booksWithDiscounts
                }
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_GET_BOOKS,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getBookById(req, res) {
        try {
            const bookId = req.params.id;
            let bookIds = [];
            let authorIds = [];

            const book = await BookModel.findOne(
                { _id: bookId, disable: false },
                { createdAt: false, updatedAt: false, __v: false, disable: false }
            ).populate('author', '_id name about country').exec();

            const author = await AuthorModel.findOne({_id: book.author._id, disable: false});
            if(!author){
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_BOOK,
                    RESPONSE_MESSAGE.BOOK_DONT_EXISTS
                );
            }

            bookIds.push(book._id);
            authorIds.push(book.author._id);

            const query = discountQuery(bookIds, authorIds);
            const discounts = await DiscountModel.find(query);
            const bookWithDiscounts = countBookDiscount([book], discounts);

            if (bookWithDiscounts.length !== 1) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_BOOK,
                    STATUS_RESPONSE.INTERNAL_SERVER_ERROR
                );
            }

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.GET_BOOK,
                bookWithDiscounts[0]
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_BOOK,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async addNewBook(req, res) {
        try {
            const requestBody = req.body;

            const book = await BookModel.findOne({ ISBN: requestBody.ISBN });
            if (book) {
                return sendResponse(
                    res,
                    STATUS_CODE.CONFLICT,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_BOOK,
                    RESPONSE_MESSAGE.BOOK_EXISTS
                );
            }

            const author = await AuthorModel.findOne({ _id: requestBody.author });
            if (!author) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_BOOK,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_AUTHOR
                );
            }

            const createdBook = await BookModel.create(requestBody);
            if (!createdBook) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_BOOK,
                    STATUS_RESPONSE.INTERNAL_SERVER_ERROR
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
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async editBook(req, res) {
        try {
            const requestBody = req.body;

            const book = await BookModel.findOne({ _id: requestBody.bookId });
            if (!book) {
                return sendResponse(
                    res,
                    STATUS_CODE.CONFLICT,
                    RESPONSE_MESSAGE.FAILED_TO_UPDATE_BOOK,
                    RESPONSE_MESSAGE.BOOK_DONT_EXISTS
                );
            }

            if (requestBody.author) {
                const author = await AuthorModel.findOne({ _id: requestBody.author });
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
                { _id: requestBody.bookId },
                { $set: requestBody },
                { new: true }
            );

            if (!updatedBook) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_UPDATE_BOOK,
                    STATUS_RESPONSE.INTERNAL_SERVER_ERROR
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
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deleteBook(req, res) {
        try {
            const { bookId } = req.body;

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
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.BOOK_DELETED,
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_DELETE_BOOK,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async disableUser(req, res) {
        try {
          const requestBody = req.body;
    
          const book = await BookModel.findOne({ _id: requestBody.bookId, disable: !requestBody.disable }, { createdAt: false, updatedAt: false, __v: false });
          if (!book) {
            return sendResponse(
              res,
              STATUS_CODE.NOT_FOUND,
              RESPONSE_MESSAGE.FAILED_TO_DISABLE_BOOK,
              RESPONSE_MESSAGE.BOOK_DONT_EXISTS
            );
          }
    
          book.disable = requestBody.disable;
          await book.save();
    
          return sendResponse(
            res,
            STATUS_CODE.OK,
            RESPONSE_MESSAGE.DISABLE_BOOK,
            book
          );
    
        } catch (err) {
          console.log(err);
          return sendResponse(
            res,
            STATUS_CODE.INTERNAL_SERVER_ERROR,
            RESPONSE_MESSAGE.FAILED_TO_DISABLE_BOOK,
            STATUS_RESPONSE.INTERNAL_SERVER_ERROR
          );
        }
      }
}

module.exports = new BookController();