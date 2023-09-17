const BookModel = require("../models/book_model");
const CartModel = require("../models/cart_model");
const UserModel = require("../models/user_model");
const { sendResponse } = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

class CartController {
    async addBookToCart(req, res) {
        try {
            const requestBody = req.body;

            const user = await UserModel.findOne({ _id: requestBody.userId });
            if (!user) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_ITEM_TO_CART,
                    RESPONSE_MESSAGE.USER_NOT_FOUND
                );
            }

            const book = await BookModel.findOne({ _id: requestBody.bookId });
            if (!book) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_ITEM_TO_CART,
                    RESPONSE_MESSAGE.BOOK_DONT_EXISTS
                );
            }

            const currentCart = await CartModel.findOne({ user: requestBody.userId });
            if (!currentCart) {
                const cart = {
                    user: requestBody.userId,
                    orderList: [{ bookId: requestBody.bookId, quantity: requestBody.quantity }]
                }

                const createdCart = await CartModel.create(cart);
                if (!createdCart) {
                    return sendResponse(
                        res,
                        STATUS_CODE.INTERNAL_SERVER_ERROR,
                        RESPONSE_MESSAGE.FAILED_TO_ADD_ITEM_TO_CART,
                        STATUS_REPONSE.INTERNAL_SERVER_ERROR
                    );
                }

                return sendResponse(
                    res,
                    STATUS_CODE.OK,
                    RESPONSE_MESSAGE.ADD_ITEM_TO_CART,
                    createdCart
                );
            }

            const existingCartBook = currentCart.orderList.find(item => item.bookId.toString() === requestBody.bookId);
            if (existingCartBook) {
                existingCartBook.quantity += requestBody.quantity;
            } else {
                currentCart.orderList.push({ bookId: requestBody.bookId, quantity: requestBody.quantity });
            }

            const updatedCart = await currentCart.save();
            if (!updatedCart) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_ITEM_TO_CART,
                    STATUS_REPONSE.INTERNAL_SERVER_ERROR
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
                STATUS_REPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async removeBookToCart(req, res) {
        try {
            const requestBody = req.body;

            const user = await UserModel.findOne({ _id: requestBody.userId });
            if (!user) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_REMOVE_ITEM_TO_CART,
                    RESPONSE_MESSAGE.USER_NOT_FOUND
                );
            }

            const book = await BookModel.findOne({ _id: requestBody.bookId });
            if (!book) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_REMOVE_ITEM_TO_CART,
                    RESPONSE_MESSAGE.BOOK_DONT_EXISTS
                );
            }

            const currentCart = await CartModel.findOne({ user: requestBody.userId });
            if (!currentCart) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_REMOVE_ITEM_TO_CART,
                    RESPONSE_MESSAGE.CART_DONT_EXISTS
                );
            }

            const existingCartBook = currentCart.orderList.find(item => item.bookId.toString() === requestBody.bookId);
            if (existingCartBook) {
                if(existingCartBook.quantity > requestBody.quantity){
                    existingCartBook.quantity -= requestBody.quantity;
                }else if(existingCartBook.quantity === requestBody.quantity){
                    console.log(currentCart.orderList);
                    currentCart.orderList = currentCart.orderList.filter(item => item.bookId.toString() !== requestBody.bookId);
                    console.log(currentCart.orderList);
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
                    STATUS_REPONSE.INTERNAL_SERVER_ERROR
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
                STATUS_REPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }
}

module.exports = new CartController();