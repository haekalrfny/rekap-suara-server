const express = require("express");
const router = express.Router();
const Suara = require("../controllers/Suara.js");
const { auth } = require("../middleware/auth.js");

router.post("/suara", auth, Suara.createSuara);
router.get("/suara/tps/:tpsId", auth, Suara.getSuaraByTPS);
router.get("/suara/byPaslon", auth, Suara.getSuaraByPaslon);
router.get("/suara/:paslonId", auth, Suara.getSuaraBySpecificPaslon);
router.get("/suara/user/:userId", auth, Suara.getSuaraByUser);

module.exports = router;
