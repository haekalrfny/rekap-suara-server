const express = require("express");
const router = express.Router();
const Partai = require("../controllers/Partai.js");
const { auth, adminAuth } = require("../middleware/auth.js");

router.post("/partai", auth, adminAuth, Partai.createPartai);
router.get("/partai", auth, Partai.getAllPartai);

module.exports = router;
