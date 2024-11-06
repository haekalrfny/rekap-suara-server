const express = require("express");
const router = express.Router();
const PilgubPaslon = require("../controllers/PilgubPaslon.js");
const { auth } = require("../middleware/auth.js");

router.post("/paslon/pilgub/create", auth, PilgubPaslon.createPaslon);
router.get("/paslon/pilgub", auth, PilgubPaslon.getAllPaslon);
router.get("/paslon/pilgub/:paslonId", auth, PilgubPaslon.getPaslonById);

module.exports = router;
