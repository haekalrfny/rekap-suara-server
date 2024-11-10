const express = require("express");
const router = express.Router();
const TPS = require("../controllers/TPS.js");
const { auth, adminAuth } = require("../middleware/auth.js");

router.post("/tps", auth, adminAuth, TPS.createTPS);
router.get("/tps", auth, TPS.getAllTPS);
router.get("/tps/id/:tpsId", auth, TPS.getTPSById);
router.patch("/tps/update/:tpsId", auth, TPS.updateTPS);
router.get("/tps/page", auth, TPS.getTPSWithPagination);
router.get("/tps/username/:tpsId", auth, TPS.getTPSByUsername);
router.get("/tps/dapil/pilkada", auth, TPS.getDapilWithSuaraPilkada);
router.get("/tps/dapil/pilgub", auth, TPS.getDapilWithSuaraPilgub);
router.get("/tps/excel/tps", auth, TPS.downloadExcelTPS);
router.get("/tps/excel/kecamatan", auth, TPS.downloadExcelTPSKecamatan);
router.get(
  "/tps/excel/paslon/pilkada",
  auth,
  TPS.downloadExcelPaslonbyTPSPilkada
);
router.get(
  "/tps/excel/paslon/pilgub",
  auth,
  TPS.downloadExcelPaslonbyTPSPilgub
);
router.get(
  "/tps/excel/paslon/kecamatan/pilkada",
  auth,
  TPS.downloadExcelPaslonbyTPSKecamatanPilkada
);
router.get(
  "/tps/excel/paslon/kecamatan/pilgub",
  auth,
  TPS.downloadExcelPaslonbyTPSKecamatanPilgub
);
router.get("/tps/report/tps", auth, TPS.getReportAllDaerah);
router.get("/tps/report/kecamatan", auth, TPS.getReportKecamatanDaerah);

module.exports = router;
