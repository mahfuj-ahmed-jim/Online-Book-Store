const { sendResponse } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_RESPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

const validateEditUser = (req, res, next) => {
    const { email, name, phoneNumber, address, disable, balance } = req.body;
    const errors = {};

    if (disable || balance) {
        return sendResponse(
            res,
            STATUS_CODE.UNPROCESSABLE_ENTITY,
            RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER,
            STATUS_RESPONSE.UNPROCESSABLE_ENTITY
        );
    }

    if (email) {
        errors.email = "Email is not modifieble"
    }

    if (name && typeof name !== "string") {
        errors.name = "Name must be a string";
    }

    if (phoneNumber && !/^\d{11}$/.test(phoneNumber)) {
        errors.phoneNumber = "Phone number must be 11 digits long";
    }

    if (address) {
        const { district, area, houseNumber } = address;

        if (!district || district === "") {
            errors.address = "District is required";
        }
        if (!area || area === "") {
            errors.address = "Area is required";
        }
        if (!houseNumber || houseNumber === "") {
            errors.address = "House number is required";
        }
    }

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER, errors);
    }

    next();
}

module.exports = {
    validateEditUser,
};