const express = require("express");
const router = express.Router();
const PilkadaSuara = require("../controllers/PilkadaSuara.js");
const { auth } = require("../middleware/auth.js");

router.post("/suara/pilkada/create", auth, PilkadaSuara.createSuara);
router.get("/suara/pilkada/tps/:tpsId", auth, PilkadaSuara.getSuaraByTPS);
router.get("/suara/pilkada/user/:userId", auth, PilkadaSuara.getSuaraByUser);
router.get("/suara/pilkada/paslon", auth, PilkadaSuara.getSuaraByPaslon);
router.get(
  "/suara/pilkada/paslon/kecamatan",
  auth,
  PilkadaSuara.getSuaraByPaslonByKecamatan
);
router.get(
  "/suara/pilkada/paslon/:paslonId",
  auth,
  PilkadaSuara.getSuaraBySpecificPaslon
);
router.get(
  "/suara/pilkada/paslon/kecamatan/:paslonId",
  auth,
  PilkadaSuara.getSuaraBySpecificPaslonByKecamatan
);
router.get(
  "/suara/pilkada/paslon/detail/:paslonId",
  auth,
  PilkadaSuara.getSuaraPaslonDetails
);

module.exports = router;
