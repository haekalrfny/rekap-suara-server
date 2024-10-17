const mongoose = require("mongoose");

const SuaraSchema = new mongoose.Schema(
  {
    tps: { type: mongoose.Schema.Types.ObjectId, ref: "tps", required: true },
    suaraPaslon: [
      {
        paslon: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "paslon",
          required: true,
        },
        jumlahSuaraSah: { type: Number, required: true },
      },
    ],
    image: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("suara", SuaraSchema, "suara");
