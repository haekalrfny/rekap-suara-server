const mongoose = require("mongoose");

const ElectionSchema = new mongoose.Schema({
  suaraSah: { type: Number },
  suaraTidakSah: { type: Number },
  suaraTidakTerpakai: { type: Number },
  kertasSuara: { type: Number },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
});

const TPSSchema = new mongoose.Schema({
  kodeTPS: { type: Number, required: true },
  desa: { type: String, required: true },
  kecamatan: { type: String, required: true },
  dapil: { type: String, required: true },
  pilkada: { type: ElectionSchema, required: true },
  pilgub: { type: ElectionSchema, required: true },
});

module.exports = mongoose.model("tps", TPSSchema, "tps");
