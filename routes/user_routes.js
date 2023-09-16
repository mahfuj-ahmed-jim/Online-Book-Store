const UserController = require("../controllers/user_controller");
const express = require("express");
const router = express.Router();

router.get("/all", UserController.getAllUsers);
router.get("/:id", UserController.getUserById);
router.put("/edit", UserController.editUser);

module.exports = router;