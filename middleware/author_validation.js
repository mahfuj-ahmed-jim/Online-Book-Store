const { sendResponse } = require("../utils/common");
const { decodeToken } = require("../utils/token_handler");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

const validateAuthorData = (req, res, next) => {
    const { name, about, country } = req.body;
    const errors = {};

    const decodedToken = decodeToken(req);
    if (decodedToken.role !== "admin") {
        return sendResponse(
            res,
            STATUS_CODE.UNAUTHORIZED,
            STATUS_REPONSE.UNAUTHORIZED,
            RESPONSE_MESSAGE.UNAUTHORIZED
        );
    }

    if (!name || name === "") {
        errors.name = "Name is required";
    }

    if (!about || about === "") {
        errors.about = "About is required";
    }

    if (!country || country === "") {
        errors.country = "Country is required";
    }

    if (Object.keys(errors).length > 0) {
        return sendResponse(res, STATUS_CODE.BAD_REQUEST, RESPONSE_MESSAGE.FAILED_TO_SIGNUP, errors);
    }

    next();
}

module.exports = { validateAuthorData };