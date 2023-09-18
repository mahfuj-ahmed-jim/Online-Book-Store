const DiscountModel = require("../models/discount_model");
const { sendResponse } = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

class DiscountController {
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
}

module.exports = new DiscountController();