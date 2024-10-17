const Partai = require("../schema/Partai.js");

// Tambah Partai
exports.createPartai = async (req, res) => {
  // Validasi input
  if (!req.body) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const partai = new Partai(req.body);
    await partai.save();
    res.status(201).json(partai);
  } catch (error) {
    console.error("Error creating Partai:", error);
    res
      .status(500)
      .json({ message: "Error creating Partai", error: error.message });
  }
};

// Ambil semua Partai
exports.getAllPartai = async (req, res) => {
  try {
    const partai = await Partai.find();
    res.status(200).json(partai);
  } catch (error) {
    console.error("Error fetching Partai:", error);
    res
      .status(500)
      .json({ message: "Error fetching Partai", error: error.message });
  }
};
