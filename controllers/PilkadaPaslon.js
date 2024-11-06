const PilkadaPaslon = require("../schema/PilkadaPaslon.js");
const excel = require("exceljs");

// Tambah Paslon
exports.createPaslon = async (req, res) => {
  // Validasi input
  if (!req.body) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const paslon = new PilkadaPaslon(req.body);
    await paslon.save();
    res.status(201).json(paslon);
  } catch (error) {
    console.error("Error creating Paslon:", error);
    res
      .status(500)
      .json({ message: "Error creating Paslon", error: error.message });
  }
};

// Ambil semua Paslon
exports.getAllPaslon = async (req, res) => {
  try {
    const paslon = await PilkadaPaslon.find().populate("partai");
    res.status(200).json(paslon);
  } catch (error) {
    console.error("Error fetching Paslon:", error);
    res
      .status(500)
      .json({ message: "Error fetching Paslon", error: error.message });
  }
};

// Ambil Paslon berdasarkan ID
exports.getPaslonById = async (req, res) => {
  try {
    const paslon = await PilkadaPaslon.findById(req.params.paslonId).populate(
      "partai"
    );
    res.status(200).json(paslon);
  } catch (error) {
    console.error("Error fetching Paslon:", error);
    res
      .status(500)
      .json({ message: "Error fetching Paslon", error: error.message });
  }
};
