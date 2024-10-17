const express = require("express");
const router = express.Router();
const Paslon = require("../controllers/Paslon.js");
const { auth, adminAuth } = require("../middleware/auth.js");

router.post("/paslon", auth, adminAuth, Paslon.createPaslon);
router.get("/paslon", auth, Paslon.getAllPaslon);
router.get("/paslon/:paslonId", auth, Paslon.getPaslonById);

module.exports = router;
