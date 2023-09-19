const AdminModel = require("../models/admin_models");
const AuthorModel = require("../models/author_model");
const { sendResponse } = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");
const mongoose = require("mongoose");

class AuthorController {
  async getAllAuthor(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const authors = await AuthorModel.find(
        { disable: false },
        { createdAt: false, updatedAt: false, __v: false }
      ).skip((page - 1) * limit)
        .limit(limit)
        .exec();;

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.GET_ALL_AUTHORS,
        authors
      );
    } catch (err) {
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_GET_AUTHORS,
        STATUS_REPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAuthorById(req, res) {
    try {
      const authorId = req.params.id;

      const isIdValid = mongoose.Types.ObjectId.isValid(authorId);
      if (!isIdValid) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_AUTHORS,
          RESPONSE_MESSAGE.AUTHOR_DONT_EXISTS
        );
      }

      const author = await AuthorModel.findOne(
        { _id: authorId, disable: false },
        { createdAt: false, updatedAt: false, __v: false }
      ).exec();

      if (!author) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_AUTHORS,
          RESPONSE_MESSAGE.AUTHOR_DONT_EXISTS
        );
      }

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.GET_AUTHOR,
        author
      );
    } catch (err) {
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_AUTHORS,
        STATUS_REPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async addNewAuthor(req, res) {
    try {
      const response = req.body;

      const author = await AuthorModel.findOne({ name: response.name });
      if (author) {
        return sendResponse(
          res,
          STATUS_CODE.CONFLICT,
          RESPONSE_MESSAGE.FAILED_TO_ADD_AUTHOR,
          RESPONSE_MESSAGE.AUTHOR_NAME_EXISTS
        );
      }

      const createdAuthor = await AuthorModel.create(response);
      if (!createdAuthor) {
        return sendResponse(
          res,
          STATUS_CODE.INTERNAL_SERVER_ERROR,
          RESPONSE_MESSAGE.FAILED_TO_ADD_AUTHOR,
          STATUS_REPONSE.INTERNAL_SERVER_ERROR
        );
      }

      return sendResponse(
        res,
        STATUS_CODE.CREATED,
        RESPONSE_MESSAGE.AUTHOR_ADDED,
        {
          id: createdAuthor._id,
          name: createdAuthor.name,
          about: createdAuthor.about,
          country: createdAuthor.country
        }
      );
    } catch (err) {
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_ADD_AUTHOR,
        STATUS_REPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new AuthorController();
