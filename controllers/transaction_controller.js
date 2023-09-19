const CartModel = require("../models/cart_model");
const DiscountModel = require("../models/discount_model");
const TransactionModel = require("../models/transaction_model");
const UserModel = require("../models/user_model");
const { sendResponse, discountQuery, countBookDiscount } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const BookModel = require("../models/book_model");

class TransactionController {
    async getAllTransactions(req, res) {
        try {
            const decodedToken = decodeToken(req);
            if (decodedToken.role !== "admin") {
                return sendResponse(
                    res,
                    STATUS_CODE.UNAUTHORIZED,
                    STATUS_RESPONSE.UNAUTHORIZED,
                    RESPONSE_MESSAGE.UNAUTHORIZED
                );
            }

            const transactions = await TransactionModel.find();

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.GET_ALL_TRANSACTIONS,
                transactions
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_GET_ALL_TRANSACTION,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getTransactionsForUser(req, res) {
        try {
            const userId = req.params.id;

            const decodedToken = decodeToken(req);
            if ((decodedToken.role === "user" && decodedToken.user.id !== userId) && decodedToken.role !== "admin") {
                return sendResponse(
                    res,
                    STATUS_CODE.UNAUTHORIZED,
                    STATUS_RESPONSE.UNAUTHORIZED,
                    RESPONSE_MESSAGE.UNAUTHORIZED
                );
            }

            const transactions = await TransactionModel.find({ user: userId });

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.GET_ALL_TRANSACTIONS,
                transactions
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_GET_ALL_TRANSACTION,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async createTransaction(req, res) {
        try {
            const decodedToken = decodeToken(req);
            if (decodedToken.role === "admin") {
                return sendResponse(
                    res,
                    STATUS_CODE.UNAUTHORIZED,
                    STATUS_RESPONSE.UNAUTHORIZED,
                    RESPONSE_MESSAGE.UNAUTHORIZED
                );
            }

            const userId = decodedToken.user.id;
            let bulk = [];
            let books = [];
            let bookIds = [];
            let authorIds = [];
            let uniqueAuthors = new Set();
            let totalPrice = 0;
            let transaction = { user: userId, orderList: [] };

            const user = await UserModel.findOne({ _id: userId });
            if (!user) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_CREATE_TRANSACTION,
                    RESPONSE_MESSAGE.USER_NOT_FOUND
                );
            }

            const cart = await CartModel.findOne({ user: userId })
                .populate({
                    path: "orderList.book",
                    select: "_id title price author",
                    populate: {
                        path: "author",
                        select: "_id name",
                    },
                })
                .exec();
            if (!cart || cart.orderList.length === 0) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_CREATE_TRANSACTION,
                    RESPONSE_MESSAGE.CART_DONT_EXISTS
                );
            }

            cart.orderList.map(cart => {
                books.push(cart.book);
                bookIds.push(cart.book._id);
                uniqueAuthors.add(cart.book.author._id);
            });
            authorIds = Array.from(uniqueAuthors);

            const booksInCart = await BookModel.find({
                _id: {
                    $in: bookIds
                }
            });

            booksInCart.map(item => {
                const bookIndex = cart.orderList.findIndex(cartItem => cartItem.book._id.toString() === item._id.toString());

                if (item.stock < cart.orderList[bookIndex].quantity) {
                    return sendResponse(
                        res,
                        STATUS_CODE.INTERNAL_SERVER_ERROR,
                        RESPONSE_MESSAGE.FAILED_TO_CREATE_TRANSACTION,
                        RESPONSE_MESSAGE.OUT_OF_STOCK
                    );
                }

                item.stock -= cart.orderList[bookIndex].quantity;
                item.totalSell += cart.orderList[bookIndex].quantity;

                bulk.push({
                    updateOne: {
                        filter: { _id: item._id },
                        update: { $set: { stock: item.stock, totalSell: item.totalSell } },
                    },
                });
            });

            const query = discountQuery(bookIds, authorIds);
            const discounts = await DiscountModel.find(query);
            const booksWithDiscounts = countBookDiscount(books, discounts);

            cart.orderList.map((item, index) => {
                item = {
                    ...item.toObject(),
                    book: booksWithDiscounts[index],
                };

                if (item.book.discountPrice) {
                    transaction.orderList.push({ book: item.book._id, quantity: item.quantity, price: item.book.price, discountPrice: item.book.discountPrice });
                    totalPrice += item.book.discountPrice * item.quantity;
                } else {
                    transaction.orderList.push({ book: item.book._id, quantity: item.quantity, price: item.book.price });
                    totalPrice += item.book.price * item.quantity;
                }

                return item;
            });

            if (user.balance < totalPrice) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_CREATE_TRANSACTION,
                    RESPONSE_MESSAGE.INSUFFECIENT_BALANCE
                );
            } else {
                user.balance -= totalPrice;
                await user.save();
            }

            cart.orderList = [];
            await cart.save();
            await BookModel.bulkWrite(bulk);

            transaction = { ...transaction, totalPrice: totalPrice };
            const createdTransaction = await TransactionModel.create(transaction);
            if (!createdTransaction) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_CREATE_TRANSACTION,
                    STATUS_RESPONSE.INTERNAL_SERVER_ERROR
                );
            }

            return sendResponse(
                res,
                STATUS_CODE.CREATED,
                RESPONSE_MESSAGE.CREATE_TRANSACTION,
                createdTransaction
            );

        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_CREATE_TRANSACTION,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }
}

module.exports = new TransactionController();