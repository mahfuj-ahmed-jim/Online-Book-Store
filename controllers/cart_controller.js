const BookModel = require("../models/book_model");
const CartModel = require("../models/cart_model");
const DiscountModel = require("../models/discount_model");
const UserModel = require("../models/user_model");
const { sendResponse, discountQuery, countBookDiscount } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const mongoose = require("mongoose");

class CartController {
    async viewUserCart(req, res) {
        try {
            const decodedToken = decodeToken(req);
            const userId = decodedToken.user.id;
            let books = [];
            let bookIds = [];
            let authorIds = [];
            let uniqueAuthors = new Set();

            if (userId && userId !== req.params.id) {
                return sendResponse(
                    res,
                    STATUS_CODE.UNAUTHORIZED,
                    STATUS_RESPONSE.UNAUTHORIZED,
                    RESPONSE_MESSAGE.UNAUTHORIZED
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
            if (!cart) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_VIEW_FROM_CART,
                    RESPONSE_MESSAGE.CART_DONT_EXISTS
                );
            }

            cart.orderList.map(cart => {
                books.push(cart.book);
                bookIds.push(cart.book._id);
                uniqueAuthors.add(cart.book.author._id);
            });
            authorIds = Array.from(uniqueAuthors);

            const query = discountQuery(bookIds, authorIds);
            const discounts = await DiscountModel.find(query);
            const booksWithDiscounts = countBookDiscount(books, discounts);

            const cartOrderListWithDiscountPrice = cart.orderList.map((item, index) => ({
                ...item.toObject(),
                book: booksWithDiscounts[index],
            }));

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.GET_USER_CART,
                cartOrderListWithDiscountPrice
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_VIEW_FROM_CART,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async addBookToCart(req, res) {
        try {
            const requestBody = req.body;
            const decodedToken = decodeToken(req);
            const userId = decodedToken.user.id;

            const user = await UserModel.findOne({ _id: userId });
            if (!user) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_ITEM_TO_CART,
                    RESPONSE_MESSAGE.USER_NOT_FOUND
                );
            }

            const isIdValid = mongoose.Types.ObjectId.isValid(requestBody.bookId);
            if (!isIdValid) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_ITEM_TO_CART,
                    RESPONSE_MESSAGE.BOOK_DONT_EXISTS
                );
            }

            const book = await BookModel.findOne({ _id: requestBody.bookId, disable: false });
            if (!book) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_ITEM_TO_CART,
                    RESPONSE_MESSAGE.BOOK_DONT_EXISTS
                );
            }

            if(book.stock < requestBody.quantity){
                return sendResponse(
                    res,
                    STATUS_CODE.CONFLICT,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_ITEM_TO_CART,
                    RESPONSE_MESSAGE.OUT_OF_STOCK
                );
            }

            const currentCart = await CartModel.findOne({ user: userId });
            if (!currentCart) {
                const cart = {
                    user: userId,
                    orderList: [{ book: requestBody.bookId, quantity: requestBody.quantity }]
                }

                const createdCart = await CartModel.create(cart);
                if (!createdCart) {
                    return sendResponse(
                        res,
                        STATUS_CODE.INTERNAL_SERVER_ERROR,
                        RESPONSE_MESSAGE.FAILED_TO_ADD_ITEM_TO_CART,
                        STATUS_RESPONSE.INTERNAL_SERVER_ERROR
                    );
                }

                return sendResponse(
                    res,
                    STATUS_CODE.OK,
                    RESPONSE_MESSAGE.ADD_ITEM_TO_CART,
                    createdCart
                );
            }

            const existingCartBook = currentCart.orderList.find(item => item.book.toString() === requestBody.bookId);
            if (existingCartBook) {
                existingCartBook.quantity += requestBody.quantity;
            } else {
                currentCart.orderList.push({ book: requestBody.bookId, quantity: requestBody.quantity });
            }

            const updatedCart = await currentCart.save();
            if (!updatedCart) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_ITEM_TO_CART,
                    STATUS_RESPONSE.INTERNAL_SERVER_ERROR
                );
            }

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.ADD_ITEM_TO_CART,
                updatedCart
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_ADD_ITEM_TO_CART,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async removeBookToCart(req, res) {
        try {
            const requestBody = req.body;
            const decodedToken = decodeToken(req);
            const userId = decodedToken.user.id;

            const user = await UserModel.findOne({ _id: userId });
            if (!user) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_REMOVE_ITEM_TO_CART,
                    RESPONSE_MESSAGE.USER_NOT_FOUND
                );
            }

            const currentCart = await CartModel.findOne({ user: userId });
            if (!currentCart) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_REMOVE_ITEM_TO_CART,
                    RESPONSE_MESSAGE.CART_DONT_EXISTS
                );
            }

            const existingCartBook = currentCart.orderList.find(item => item.book.toString() === requestBody.bookId);
            if (existingCartBook) {
                if (existingCartBook.quantity > requestBody.quantity) {
                    existingCartBook.quantity -= requestBody.quantity;
                } else if (existingCartBook.quantity === requestBody.quantity) {
                    currentCart.orderList = currentCart.orderList.filter(item => item.book.toString() !== requestBody.bookId);
                }
            } else {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_REMOVE_ITEM_TO_CART,
                    RESPONSE_MESSAGE.BOOK_DONT_EXISTS_IN_CART
                );
            }

            const updatedCart = await currentCart.save();
            if (!updatedCart) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_REMOVE_ITEM_TO_CART,
                    STATUS_RESPONSE.INTERNAL_SERVER_ERROR
                );
            }

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.REMOVE_ITEM_FROM_CART,
                updatedCart
            );
        } catch (err) {
            console.log(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_REMOVE_ITEM_TO_CART,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }
}

module.exports = new CartController();