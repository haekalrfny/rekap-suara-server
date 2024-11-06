const express = require("express");
const router = express.Router();
const PilkadaPaslon = require("../controllers/PilkadaPaslon.js");
const { auth } = require("../middleware/auth.js");

router.post("/paslon/pilkada/create", auth, PilkadaPaslon.createPaslon);
router.get("/paslon/pilkada", auth, PilkadaPaslon.getAllPaslon);
router.get("/paslon/pilkada/:paslonId", auth, PilkadaPaslon.getPaslonById);

module.exports = router;
