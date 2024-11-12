const express = require("express");
const router = express.Router();
const PilgubSuara = require("../controllers/PilgubSuara.js");
const { auth } = require("../middleware/auth.js");

router.post("/suara/pilgub/create", auth, PilgubSuara.createSuara);
router.get("/suara/pilgub/tps/:tpsId", auth, PilgubSuara.getSuaraByTPS);
router.get("/suara/pilgub/user/:userId", auth, PilgubSuara.getSuaraByUser);
router.get("/suara/pilgub/paslon", auth, PilgubSuara.getSuaraByPaslon);
router.get(
  "/suara/pilgub/paslon/kecamatan",
  auth,
  PilgubSuara.getSuaraByPaslonByKecamatan
);
router.get(
  "/suara/pilgub/paslon/:paslonId",
  auth,
  PilgubSuara.getSuaraBySpecificPaslon
);
router.get(
  "/suara/pilgub/paslon/kecamatan/:paslonId",
  auth,
  PilgubSuara.getSuaraBySpecificPaslonByKecamatan
);
router.get(
  "/suara/pilgub/paslon/detail/:paslonId",
  auth,
  PilgubSuara.getSuaraPaslonDetails
);

module.exports = router;
