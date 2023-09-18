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

            const newDiscount = new DiscountModel(requestBody);
            await newDiscount.save();

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
}

module.exports = new DiscountController();