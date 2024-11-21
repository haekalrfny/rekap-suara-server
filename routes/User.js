const express = require("express");
const router = express.Router();
const User = require("../controllers/User.js");
const { auth } = require("../middleware/auth.js");

router.post("/register", User.registerUser);
router.post("/login", User.loginUser);
router.get("/user/check", User.getUserByToken);
router.get("/user/:userId", auth, User.getUserById);
router.get("/user/tps/:tpsId", auth, User.getUserByTPS);
router.get("/users/page", auth, User.getUsersWithPagination);
router.patch("/attendance/:userId", auth, User.attendanceUser);
router.patch("/user/update/:userId", auth, User.updateUser);

module.exports = router;
