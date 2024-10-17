const mongoose = require("mongoose");

const PartaiSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  image: { type: String, required: true },
});

module.exports = mongoose.model("partai", PartaiSchema, "partai");
