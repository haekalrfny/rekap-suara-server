const mongoose = require("mongoose");

const PilkadaPaslonSchema = new mongoose.Schema({
  ketua: { type: String, required: true },
  wakilKetua: { type: String, required: true },
  noUrut: { type: Number, required: true },
  panggilan: { type: String, required: true },
  partai: [
    { type: mongoose.Schema.Types.ObjectId, ref: "partai", required: true },
  ],
});

module.exports = mongoose.model(
  "pilkadaPaslon",
  PilkadaPaslonSchema,
  "pilkadaPaslon"
);
