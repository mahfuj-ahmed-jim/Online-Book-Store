const AuthController = require("../controllers/auth_controller");
const { validateToken } = require("../middleware/token_validation");
const { validateAdminSignup } = require("../middleware/auth_validation");
const express = require("express");
const router = express.Router();

router.post("/signup", (req, res, next) => {
    const { role } = req.body;
    if (role === 1) {
        validateToken(req, res, next);
    } else {
        next();
    }
}, (req, res, next) => {
    const { role } = req.body;
    if (role === 1) {
        validateAdminSignup(req, res, next);
    } else {
        next();
    }
}, AuthController.signup);
router.post("/login", AuthController.login);

module.exports = router;