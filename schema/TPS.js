const mongoose = require("mongoose");

const TPSSchema = new mongoose.Schema({
  kodeTPS: { type: String, required: true },
  desa: { type: String, required: true },
  kecamatan: { type: String, required: true },
  dapil: { type: String, required: true },
  jumlahSuaraSah: { type: Number, required: true },
  jumlahSuaraTidakSah: { type: Number, required: true },
  jumlahTotal: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
});

module.exports = mongoose.model("tps", TPSSchema, "tps");
