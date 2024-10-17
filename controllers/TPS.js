const TPS = require("../schema/TPS.js");
const Suara = require("../schema/Suara.js");
const User = require("../schema/User.js");

// Tambah TPS
exports.createTPS = async (req, res) => {
  // Validasi input
  if (!req.body) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const tps = new TPS(req.body);
    await tps.save();
    res.status(201).json(tps);
  } catch (error) {
    console.error("Error creating TPS:", error);
    res
      .status(500)
      .json({ message: "Error creating TPS", error: error.message });
  }
};

// Ambil semua TPS
exports.getAllTPS = async (req, res) => {
  try {
    const tps = await TPS.find();
    res.status(200).json(tps);
  } catch (error) {
    console.error("Error fetching TPS:", error);
    res
      .status(500)
      .json({ message: "Error fetching TPS", error: error.message });
  }
};

// Ambil TPS berdasarkan ID
exports.getTPSById = async (req, res) => {
  const { tpsId } = req.params;
  try {
    const tps = await TPS.findById(tpsId);
    if (!tps) {
      return res.status(404).json({ message: "TPS not found" });
    }
    res.status(200).json(tps);
  } catch (error) {
    console.error("Error fetching TPS:", error);
    res
      .status(500)
      .json({ message: "Error fetching TPS", error: error.message });
  }
};

// Update TPS berdasarkan ID
exports.updateTPS = async (req, res) => {
  const { tpsId } = req.params;

  // Validasi input
  if (!req.body) {
    return res
      .status(400)
      .json({ message: "Please provide the fields to update" });
  }

  try {
    const updatedTPS = await TPS.findByIdAndUpdate(tpsId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTPS) {
      return res.status(404).json({ message: "TPS not found" });
    }

    res.status(200).json(updatedTPS);
  } catch (error) {
    console.error("Error updating TPS:", error);
    res.status(500).json({
      message: "Error updating TPS",
      error: error.message,
    });
  }
};

// Ambil semua TPS dengan pagination
exports.getTPSWithPagination = async (req, res) => {
  const { page = 0, limit = 7, filter = "" } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  if (isNaN(pageNumber) || isNaN(limitNumber) || limitNumber < 1) {
    return res.status(400).json({
      message:
        "Page must be a non-negative integer and limit must be a positive integer",
    });
  }

  try {
    let filterObject = {};

    if (filter) {
      filterObject = {
        $or: [
          { kecamatan: { $regex: filter, $options: "i" } },
          { desa: { $regex: filter, $options: "i" } },
          { kodeTPS: { $regex: filter, $options: "i" } },
        ],
      };
    }

    const tps = await TPS.find(filterObject)
      .limit(limitNumber)
      .skip(pageNumber * limitNumber)
      .exec();

    const totalRows = await TPS.countDocuments(filterObject);

    res.status(200).json({
      result: tps,
      page: pageNumber,
      limit: limitNumber,
      totalRows,
      totalPage: Math.ceil(totalRows / limitNumber),
    });
  } catch (error) {
    console.error("Error fetching TPS with pagination:", error);
    res.status(500).json({
      message: "Error fetching TPS with pagination",
      error: error.message,
    });
  }
};

exports.getReportByDaerah = async (req, res) => {
  const { kecamatan, desa, kodeTPS, paslonId } = req.query;

  try {
    let report = {};

    // Menghitung total suara untuk paslon tertentu berdasarkan ID paslon
    const getTotalSuaraPaslon = async (filter) => {
      const suaraData = await Suara.find(filter).populate("suaraPaslon.paslon");
      let totalSuara = 0;

      suaraData.forEach((suara) => {
        suara.suaraPaslon.forEach((paslonData) => {
          if (paslonData.paslon._id.toString() === paslonId) {
            totalSuara += paslonData.jumlahSuaraSah;
          }
        });
      });

      return totalSuara;
    };

    // Kondisi 1: Hanya kecamatan yang diisi
    if (kecamatan && !desa && !kodeTPS) {
      const tpsKecamatan = await TPS.find({ kecamatan });
      const totalSuaraKecamatan = await getTotalSuaraPaslon({
        tps: { $in: tpsKecamatan.map((t) => t._id) },
      });

      report = {
        kecamatan,
        paslonId,
        totalSuaraKecamatan,
        totalPesertaKecamatan:
          tpsKecamatan.reduce((acc, curr) => acc + curr.jumlahPeserta, 0) || 0,
      };
    }

    // Kondisi 2: Kecamatan dan Desa diisi
    else if (kecamatan && desa && !kodeTPS) {
      const tpsKecamatan = await TPS.find({ kecamatan });
      const tpsDesa = await TPS.find({ kecamatan, desa });
      const totalSuaraKecamatan = await getTotalSuaraPaslon({
        tps: { $in: tpsKecamatan.map((t) => t._id) },
      });
      const totalSuaraDesa = await getTotalSuaraPaslon({
        tps: { $in: tpsDesa.map((t) => t._id) },
      });

      report = {
        kecamatan,
        desa,
        paslonId,
        totalSuaraKecamatan,
        totalPesertaKecamatan:
          tpsKecamatan.reduce((acc, curr) => acc + curr.jumlahPeserta, 0) || 0,
        totalSuaraDesa,
        totalPesertaDesa:
          tpsDesa.reduce((acc, curr) => acc + curr.jumlahPeserta, 0) || 0,
      };
    }

    // Kondisi 3: Kecamatan, Desa, dan kodeTPS diisi
    else if (kecamatan && desa && kodeTPS) {
      const tpsKecamatan = await TPS.find({ kecamatan });
      const tpsDesa = await TPS.find({ kecamatan, desa });
      const tps = await TPS.findOne({ kecamatan, desa, kodeTPS });
      const totalSuaraKecamatan = await getTotalSuaraPaslon({
        tps: { $in: tpsKecamatan.map((t) => t._id) },
      });
      const totalSuaraDesa = await getTotalSuaraPaslon({
        tps: { $in: tpsDesa.map((t) => t._id) },
      });
      const totalSuaraTPS = await getTotalSuaraPaslon({ tps: tps._id });

      report = {
        kecamatan,
        desa,
        kodeTPS,
        paslonId,
        totalSuaraKecamatan,
        totalPesertaKecamatan:
          tpsKecamatan.reduce((acc, curr) => acc + curr.jumlahPeserta, 0) || 0,
        totalSuaraDesa,
        totalPesertaDesa:
          tpsDesa.reduce((acc, curr) => acc + curr.jumlahPeserta, 0) || 0,
        totalSuaraTPS,
        totalPesertaTPS: tps.jumlahPeserta || 0,
      };
    }

    return res.status(200).json(report);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getReportAllDaerah = async (req, res) => {
  try {
    const totalKecamatan = await TPS.distinct("kecamatan");
    const suaraTPS = await Suara.find().populate("tps");
    const kecamatanWithSuara = suaraTPS
      .filter((suara) => suara.tps && suara.tps.kecamatan)
      .map((suara) => suara.tps.kecamatan);
    const totalKecamatanWithSuara = new Set(kecamatanWithSuara).size;

    const totalDesa = await TPS.distinct("desa");
    const desaWithSuara = suaraTPS
      .filter((suara) => suara.tps && suara.tps.desa)
      .map((suara) => suara.tps.desa);
    const totalDesaWithSuara = new Set(desaWithSuara).size;

    const totalSaksi = await User.countDocuments();
    const totalSaksiWithSuara = (await Suara.distinct("user")).length;

    res.status(200).json({
      totalKecamatan: totalKecamatan.length,
      totalKecamatanWithSuara,
      totalDesa: totalDesa.length,
      totalDesaWithSuara,
      totalSaksi,
      totalSaksiWithSuara,
    });
  } catch (error) {
    console.error("Error fetching summary data:", error);
    res.status(500).json({
      message: "Error fetching summary data",
      error: error.message,
    });
  }
};
