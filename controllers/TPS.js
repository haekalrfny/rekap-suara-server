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
          { dapil: { $regex: filter, $options: "i" } },
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
  const { kecamatan, desa, kodeTPS, paslonId, dapil } = req.query;

  try {
    const tpsQuery = {
      ...(kecamatan && { kecamatan }),
      ...(desa && { desa }),
      ...(kodeTPS && { kodeTPS }),
      ...(dapil && { dapil }),
    };

    const tpsList = await TPS.find(tpsQuery).lean();
    const tpsIds = tpsList.map((tps) => tps._id);

    const suaraTPS = await Suara.find({
      tps: { $in: tpsIds },
    })
      .populate("tps")
      .lean();

    // Menghitung total desa
    const totalDesa = await TPS.distinct("desa", { kecamatan });
    const desaWithSuaraSet = new Set(suaraTPS.map((suara) => suara.tps?.desa));
    const totalDesaWithSuara = desaWithSuaraSet.size;

    // Helper to calculate TPS with suara
    const getTpsWithSuaraCount = (tpsList, suaraTPS) => {
      return tpsList.filter((tps) =>
        suaraTPS.some(
          (suara) => suara.tps._id.toString() === tps._id.toString()
        )
      ).length;
    };

    const tpsInDesa = await TPS.countDocuments({ desa });

    // Prepare the response
    const response = {
      totalDesa: totalDesa.length,
      totalDesaWithSuara,
      totalTPS: tpsInDesa,
      totalTpsWithSuara: getTpsWithSuaraCount(tpsList, suaraTPS),
    };

    // Jika dapil dipilih, tambahkan perhitungan totalKecamatan dan totalKecamatanWithSuara
    if (dapil) {
      const totalKecamatan = await TPS.distinct("kecamatan", { dapil });
      const kecamatanWithSuaraSet = new Set(
        suaraTPS.map((suara) => suara.tps?.kecamatan)
      );
      const totalKecamatanWithSuara = kecamatanWithSuaraSet.size;

      response.totalKecamatan = totalKecamatan.length; // Tambahkan hasil total kecamatan
      response.totalKecamatanWithSuara = totalKecamatanWithSuara; // Tambahkan hasil total kecamatan dengan suara
    }

    // Jika hanya ada kecamatan dan paslonId
    if (kecamatan && paslonId && !desa && !kodeTPS) {
      return res.status(200).json(response);
    }

    // Jika ada kecamatan, desa dan paslonId
    if (kecamatan && desa && paslonId && !kodeTPS) {
      return res.status(200).json(response);
    }

    // Jika semua parameter (kecamatan, desa, tps, dan paslonId) ada
    if (kecamatan && desa && kodeTPS && paslonId) {
      const totalSuaraSahPerPaslon = suaraTPS.reduce((total, suara) => {
        const paslonSuara = suara.suaraPaslon.find(
          (paslon) => paslon.paslon.toString() === paslonId
        );
        return total + (paslonSuara ? paslonSuara.jumlahSuaraSah : 0);
      }, 0);

      // Menghitung total suara sah untuk semua paslon di kodeTPS yang dipilih
      const selectedTPS = tpsList.find((tps) => tps.kodeTPS === kodeTPS);
      const totalSuaraSahPerSelectedTPS = suaraTPS
        .filter(
          (suara) => suara.tps._id.toString() === selectedTPS?._id.toString()
        )
        .reduce(
          (total, suara) =>
            total +
            suara.suaraPaslon.reduce(
              (sum, paslon) => sum + paslon.jumlahSuaraSah,
              0
            ),
          0
        );

      return res.status(200).json({
        ...response,
        totalSuaraSahPerPaslon,
        totalSuaraSahPerSelectedTPS,
      });
    }

    // Jika tidak memenuhi kriteria apapun
    return res.status(200).json({
      ...response,
    });
  } catch (error) {
    console.error(
      "Error fetching report data by kecamatan, desa, TPS, and paslon:",
      error
    );
    res.status(500).json({
      message: "Error fetching report data",
      error: error.message,
    });
  }
};

exports.getReportAllDaerah = async (req, res) => {
  try {
    const suaraTPS = await Suara.find().populate("tps");

    const totalDapil = await TPS.distinct("dapil");
    const dapilWithSuara = suaraTPS
      .filter((suara) => suara.tps && suara.tps.dapil)
      .map((suara) => suara.tps.dapil);
    const totalDapilWithSuara = new Set(dapilWithSuara).size;

    const totalKecamatan = await TPS.distinct("kecamatan");
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
      totalDapil: totalDapil.length,
      totalDapilWithSuara,
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
