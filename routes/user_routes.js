const UserController = require("../controllers/user_controller");
const { validateToken } = require("../middleware/token_validation");
const { validateEditUser } = require("../middleware/user_validation");
const express = require("express");
const router = express.Router();

router.get("/all", validateToken, UserController.getAllUsers);
router.get("/:id", validateToken, UserController.getUserById);
router.put("/edit", validateToken, validateEditUser, UserController.editUser);
router.delete('/delete', validateToken, UserController.deleteUser);
router.patch('/balance', validateToken, UserController.updateUserBalance);

module.exports = router;