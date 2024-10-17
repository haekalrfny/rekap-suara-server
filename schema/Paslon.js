const mongoose = require("mongoose");

const PaslonSchema = new mongoose.Schema({
  namaCalonKetua: { type: String, required: true },
  namaWakilKetua: { type: String, required: true },
  noUrut: { type: Number, required: true },
  panggilan: { type: String, required: true },
  partai: [
    { type: mongoose.Schema.Types.ObjectId, ref: "partai", required: true },
  ],
  jumlahSuaraSah: { type: Number, required: true },
});

module.exports = mongoose.model("paslon", PaslonSchema, "paslon");
