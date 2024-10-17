const mongoose = require("mongoose");

const TPSSchema = new mongoose.Schema({
  kodeTPS: { type: String, required: true },
  desa: { type: String, required: true },
  kecamatan: { type: String, required: true },
  jumlahPeserta: { type: Number, required: true },
  jumlahSuaraSah: { type: Number, required: true },
  jumlahSuaraTidakSah: { type: Number, required: true },
  jumlahSuaraTidakTerpakai: { type: Number, required: true },
});

module.exports = mongoose.model("tps", TPSSchema, "tps");
