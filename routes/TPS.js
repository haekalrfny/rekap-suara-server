const express = require("express");
const router = express.Router();
const TPS = require("../controllers/TPS.js");
const { auth, adminAuth } = require("../middleware/auth.js");

router.post("/tps", auth, adminAuth, TPS.createTPS);
router.get("/tps", auth, TPS.getAllTPS);
router.get("/tps/by/:tpsId", auth, TPS.getTPSById);
router.get("/tps/page", auth, TPS.getTPSWithPagination);
router.get("/tps/kecamatan/page", auth, TPS.getTPSKecamatanWithPagination);
router.get("/tps/report/all", auth, TPS.getReportAllDaerah);
router.get('/tps/report/kecamatan', auth, TPS.getReportKecamatanDaerah);
router.get("/report/daerah", auth, TPS.getReportByDaerah);
router.get("/tps/downloadExcel", auth, TPS.downloadExcelTPS);
router.get(
  "/tps/downloadExcelByKecamatan",
  auth,
  TPS.downloadExcelTPSKecamatan
);

router.get("/tps/downloadExcelPaslonByTPS", auth, TPS.downloadExcelPaslonbyTPS);
router.get(
  "/tps/downloadExcelPaslonByKecamatan",
  auth,
  TPS.downloadExcelPaslonbyTPSKecamatan
);
router.get("/tps/by/username/:username", auth, TPS.getTPSByUsername);
router.patch("/tps/update/:tpsId", auth, TPS.updateTPS);

module.exports = router;
