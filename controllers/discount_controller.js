const DiscountModel = require("../models/discount_model");
const { sendResponse } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

class DiscountController {
    async getAllDiscount(req, res) {
        try {
            const decodedToken = decodeToken(req);
            if (decodedToken.role !== "admin" && !decodedToken.admin.superAdmin) {
                return sendResponse(
                    res,
                    STATUS_CODE.UNAUTHORIZED,
                    STATUS_RESPONSE.UNAUTHORIZED,
                    RESPONSE_MESSAGE.UNAUTHORIZED
                );
            }

            const discounts = await DiscountModel.find({}, { createdAt: false, updatedAt: false, __v: false })
                .populate({ path: "books", model: "books", select: "_id title price stock totalSell" })
                .populate({ path: "authors", model: "authors", select: "_id name country " })
                .exec();

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.GET_DISCOUNTS,
                discounts
            );

        } catch (err) {
            console.error(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_GET_DISCOUNTS,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async addDiscount(req, res) {
        try {
            const requestBody = req.body;

            if (requestBody.type === 1) {
                const existingDiscount = await DiscountModel.findOne({
                    type: 1,
                    books: { $in: requestBody.books },
                    validTo: { $gte: new Date() },
                });

                if (existingDiscount) {
                    return sendResponse(
                        res,
                        STATUS_CODE.BAD_REQUEST,
                        RESPONSE_MESSAGE.FAILED_TO_ADD_DISCOUNT,
                        RESPONSE_MESSAGE.DISCOUNT_ALREADY_EXISTS_FOR_BOOK
                    );
                }
            } else if (requestBody.type === 2) {
                const existingDiscount = await DiscountModel.findOne({
                    type: 2,
                    authors: { $in: requestBody.authors },
                    validTo: { $gte: new Date() },
                });

                if (existingDiscount) {
                    return sendResponse(
                        res,
                        STATUS_CODE.BAD_REQUEST,
                        RESPONSE_MESSAGE.FAILED_TO_ADD_DISCOUNT,
                        RESPONSE_MESSAGE.DISCOUNT_ALREADY_EXISTS_FOR_AUTHOR
                    );
                }
            }

            const newDiscount = await DiscountModel.create(requestBody);
            if (!newDiscount) {
                return sendResponse(
                    res,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    RESPONSE_MESSAGE.FAILED_TO_ADD_DISCOUNT,
                    STATUS_RESPONSE.INTERNAL_SERVER_ERROR
                );
            }

            return sendResponse(
                res,
                STATUS_CODE.CREATED,
                RESPONSE_MESSAGE.DISCOUNT_ADDED_SUCCESSFULLY,
                newDiscount
            );
        } catch (err) {
            console.error(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_ADD_DISCOUNT,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async updateDiscount(req, res) {
        try {
            const requestBody = req.body;
            const { discountId } = req.body;

            let discount = await DiscountModel.find({ _id: discountId });
            if (!discount) {
                return sendResponse(
                    res,
                    STATUS_CODE.BAD_REQUEST,
                    RESPONSE_MESSAGE.FAILED_TO_UPDATE_DISCOUNT,
                    RESPONSE_MESSAGE.DISCOUNT_ALREADY_EXISTS_FOR_BOOK
                );
            }

            if (requestBody.type === 1) {
                const existingDiscount = await DiscountModel.findOne({
                    _id: { $ne: requestBody.discountId },
                    type: 1,
                    books: { $in: requestBody.books },
                    validTo: { $gte: new Date() },
                });

                if (existingDiscount) {
                    return sendResponse(
                        res,
                        STATUS_CODE.BAD_REQUEST,
                        RESPONSE_MESSAGE.FAILED_TO_UPDATE_DISCOUNT,
                        RESPONSE_MESSAGE.DISCOUNT_ALREADY_EXISTS_FOR_BOOK
                    );
                }
            } else if (requestBody.type === 2) {
                const existingDiscount = await DiscountModel.findOne({
                    _id: { $ne: requestBody.discountId },
                    type: 2,
                    authors: { $in: requestBody.authors },
                    validTo: { $gte: new Date() },
                });

                if (existingDiscount) {
                    return sendResponse(
                        res,
                        STATUS_CODE.BAD_REQUEST,
                        RESPONSE_MESSAGE.FAILED_TO_UPDATE_DISCOUNT,
                        RESPONSE_MESSAGE.DISCOUNT_ALREADY_EXISTS_FOR_AUTHOR
                    );
                }
            }

            delete requestBody.discountId;
            delete discount._id;
            discount = { ...discount.toObject, ...requestBody };

            const updatedDiscount = await DiscountModel.findOneAndUpdate(
                { _id: discountId },
                { $set: discount },
                { new: true }
            );

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.DISCOUNT_UPDATED_SUCCESSFULLY,
                updatedDiscount
            );
        } catch (err) {
            console.error(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_UPDATE_DISCOUNT,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deleteDiscount(req, res) {
        try {
            const { discountId } = req.body;

            const decodedToken = decodeToken(req);
            if (decodedToken.role !== "admin" && !decodedToken.admin.superAdmin) {
                return sendResponse(
                    res,
                    STATUS_CODE.UNAUTHORIZED,
                    STATUS_REPONSE.UNAUTHORIZED,
                    RESPONSE_MESSAGE.UNAUTHORIZED
                );
            }

            const deletedDiscount = await DiscountModel.findOneAndDelete({ _id: discountId });

            if (!deletedDiscount) {
                return sendResponse(
                    res,
                    STATUS_CODE.NOT_FOUND,
                    RESPONSE_MESSAGE.FAILED_TO_DELETE_DISCOUNT,
                    RESPONSE_MESSAGE.DISCOUNT_NOT_FOUND
                );
            }

            return sendResponse(
                res,
                STATUS_CODE.OK,
                RESPONSE_MESSAGE.DISCOUNT_DELETED_SUCCESSFULLY,

            );
        } catch (err) {
            console.error(err);
            return sendResponse(
                res,
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                RESPONSE_MESSAGE.FAILED_TO_DELETE_DISCOUNT,
                STATUS_RESPONSE.INTERNAL_SERVER_ERROR
            );
        }
    }

}

module.exports = new DiscountController();