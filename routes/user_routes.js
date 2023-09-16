const UserController = require("../controllers/user_controller");
const express = require("express");
const router = express.Router();

router.get("/all", UserController.getAllUsers);
router.get("/:id", UserController.getUserById);
router.put("/edit", UserController.editUser);
router.delete('/:id', UserController.deleteUser);
router.patch('/balance', UserController.updateUserBalance);

module.exports = router;