const mongoose = require("mongoose");

const PilkadaSuaraSchema = new mongoose.Schema(
  {
    tps: { type: mongoose.Schema.Types.ObjectId, ref: "tps", required: true },
    suaraPaslon: [
      {
        paslon: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "pilkadaPaslon",
          required: true,
        },
        suaraSah: { type: Number, required: true },
      },
    ],
    image: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model(
  "pilkadaSuara",
  PilkadaSuaraSchema,
  "pilkadaSuara"
);
