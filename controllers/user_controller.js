const AuthModel = require("../models/auth_model");
const UserModel = require("../models/user_model");
const { sendResponse } = require("../utils/common");
const STATUS_CODE = require("../constants/status_codes");
const STATUS_REPONSE = require("../constants/status_response");
const RESPONSE_MESSAGE = require("../constants/response_message");

class UserController {
  async getAllUsers(req, res) {
    try {
      const users = await UserModel.find(
        {},
        { createdAt: false, updatedAt: false, __v: false }
      );

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.GET_ALL_USERS,
        users
      );
    } catch (err) {
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_GET_USERS,
        STATUS_REPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserById(req, res) {
    try {
      const userId = req.params.id;

      const user = await UserModel.findOne(
        { _id: userId },
        { createdAt: false, updatedAt: false, __v: false }
      );

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.GET_USER,
        user
      );
    } catch (err) {
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_GET_SINGLE_USER,
        STATUS_REPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async editUser(req, res) {
    try {
      const response = req.body;

      const user = await UserModel.findOne({ _id: response.userId });
      if (!user) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      if (response.phoneNumber) {
        const isPhoneNumberUnique = await UserModel.findOne({
          _id: { $ne: response.userId },
          phoneNumber: response.phoneNumber,
        });

        if (isPhoneNumberUnique) {
          return sendResponse(
            res,
            STATUS_CODE.CONFLICT,
            RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER,
            RESPONSE_MESSAGE.PHONE_NUMBER_NOT_UNIQUE
          );
        }
      }

      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: response.userId },
        { $set: response },
        { new: true }
      );

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.USER_UPDATED,
        updatedUser
      );
    } catch (err) {
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER,
        STATUS_REPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_DELETE_USER,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      await UserModel.deleteOne({ _id: userId });
      await AuthModel.deleteOne({ user: userId });

      return sendResponse(
        res,
        STATUS_CODE.NO_CONTENT,
        RESPONSE_MESSAGE.DELETE_USER
      );
    } catch (err) {
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_DELETE_USER,
        STATUS_REPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateUserBalance(req, res) {
    try {
      const requestBody = req.body;

      const user = await UserModel.findOne({ _id: requestBody.userId }, { createdAt: false, updatedAt: false, __v: false });
      if (!user) {
        return sendResponse(
          res,
          STATUS_CODE.NOT_FOUND,
          RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER_BALANCE,
          RESPONSE_MESSAGE.USER_NOT_FOUND
        );
      }

      user.balance += requestBody.amount;
      await user.save();

      return sendResponse(
        res,
        STATUS_CODE.OK,
        RESPONSE_MESSAGE.USER_BALANCE_UPDATED,
        user
      );

    } catch (err) {
      console.log(err);
      return sendResponse(
        res,
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_MESSAGE.FAILED_TO_UPDATE_USER_BALANCE,
        STATUS_REPONSE.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new UserController();
