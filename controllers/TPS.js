const TPS = require("../schema/TPS.js");
const Suara = require("../schema/Suara.js");
const Paslon = require("../schema/Paslon.js");
const User = require("../schema/User.js");
const excel = require("exceljs");

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
      .populate("user", "username")
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

exports.getTPSKecamatanWithPagination = async (req, res) => {
  const { page = 0, limit = 7, filter = "", kecamatan = "" } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  if (
    isNaN(pageNumber) ||
    pageNumber < 0 ||
    isNaN(limitNumber) ||
    limitNumber < 1
  ) {
    return res.status(400).json({
      message:
        "Page must be a non-negative integer and limit must be a positive integer",
    });
  }

  try {
    const filterObject = {
      $and: [
        { kecamatan: { $regex: kecamatan, $options: "i" } },
        {
          $or: [
            { desa: { $regex: filter, $options: "i" } },
            { kodeTPS: { $regex: filter, $options: "i" } },
          ],
        },
      ],
    };

    const tps = await TPS.find(filterObject)
      .populate("user", "username")
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

exports.getTPSByUsername = async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({
      message: "Username is required",
    });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const tps = await TPS.findOne({ user: user._id }).populate(
      "user",
      "username"
    );

    res.status(200).json(tps);
  } catch (error) {
    console.error("Error fetching TPS by username:", error);
    res.status(500).json({
      message: "Error fetching TPS by username",
      error: error.message,
    });
  }
};

exports.getReportByDaerah = async (req, res) => {
  const { kecamatan, desa, kodeTPS, paslonId, dapil } = req.query;

  try {
    if (paslonId && !kecamatan && !desa && !kodeTPS && !dapil) {
      return res.status(204).send();
    }

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

    // Helper untuk menghitung TPS dengan suara
    const getTpsWithSuaraCount = (tpsList, suaraTPS) => {
      return tpsList.filter((tps) =>
        suaraTPS.some(
          (suara) => suara.tps._id.toString() === tps._id.toString()
        )
      ).length;
    };

    const tpsInDesa = await TPS.countDocuments({ desa });

    // Siapkan response
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

    // Jika semua parameter (kecamatan, desa, kodeTPS, dan paslonId) ada
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

    const totalDesaWithKecamatan = await TPS.aggregate([
      {
        $group: {
          _id: { desa: "$desa", kecamatan: "$kecamatan" },
        },
      },
    ]);

    const desaWithSuara = suaraTPS
      .filter((suara) => suara.tps && suara.tps.desa)
      .map((suara) => suara.tps.desa);
    const totalDesaWithSuara = new Set(desaWithSuara).size;

    const totalTPS = await TPS.countDocuments();
    const totalTPSWithSuara = (await Suara.distinct("tps")).length;

    const totalSaksi = await User.countDocuments({ role: "user" });
    const totalSaksiWithSuara = (await Suara.distinct("user")).length;

    res.status(200).json({
      totalDapil: totalDapil.length,
      totalDapilWithSuara,
      totalKecamatan: totalKecamatan.length,
      totalKecamatanWithSuara,
      totalDesa: totalDesaWithKecamatan.length,
      totalDesaWithSuara,
      totalTPS,
      totalTPSWithSuara,
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

exports.getReportKecamatanDaerah = async (req, res) => {
  const { kecamatan } = req.query;
  console.log(kecamatan);

  if (!kecamatan) {
    return res.status(400).json({ message: "Kecamatan is required" });
  }

  try {
    const tpsList = await TPS.find({ kecamatan });
    // Hitung total desa yang ada dalam kecamatan tersebut
    const totalDesa = new Set(tpsList.map((tps) => tps.desa)).size;

    // Ambil semua suara yang ada di kecamatan tersebut
    const suaraTPS = await Suara.find({
      tps: { $in: tpsList.map((tps) => tps._id) },
    }).populate("tps");

    // Hitung total desa yang memiliki suara
    const desaWithSuara = suaraTPS
      .filter((suara) => suara.tps && suara.tps.desa)
      .map((suara) => suara.tps.desa);
    const totalDesaWithSuara = new Set(desaWithSuara).size;

    // Hitung total TPS dan TPS yang memiliki suara
    const totalTPS = tpsList.length;
    const totalTPSWithSuara = new Set(
      suaraTPS.map((suara) => suara.tps._id.toString())
    ).size;

    // Hitung total saksi dan saksi yang memiliki suara
    const totalSaksi = await User.countDocuments({ role: "user", kecamatan });
    const totalSaksiWithSuara = new Set(
      suaraTPS.map((suara) => suara.user.toString())
    ).size;
    res.status(200).json({
      totalDesa,
      totalDesaWithSuara,
      totalTPS,
      totalTPSWithSuara,
      totalSaksi,
      totalSaksiWithSuara,
    });
  } catch (error) {
    console.error("Error fetching report by kecamatan:", error);
    res.status(500).json({
      message: "Error fetching report by kecamatan",
      error: error.message,
    });
  }
};

exports.downloadExcelTPS = async (req, res) => {
  const { kecamatan } = req.query;
  try {
    const tpsData = await TPS.find().lean();
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Data TPS");

    worksheet.columns = [
      { header: "Kode TPS", key: "kodeTPS", width: 15 },
      { header: "Desa", key: "desa", width: 20 },
      { header: "Kecamatan", key: "kecamatan", width: 20 },
      { header: "Dapil", key: "dapil", width: 15 },
      { header: "Jumlah Suara Sah", key: "jumlahSuaraSah", width: 20 },
      {
        header: "Jumlah Suara Tidak Sah",
        key: "jumlahSuaraTidakSah",
        width: 25,
      },
      { header: "Jumlah Total", key: "jumlahTotal", width: 15 },
    ];

    tpsData.forEach((tps) => {
      worksheet.addRow({
        kodeTPS: tps.kodeTPS,
        desa: tps.desa,
        kecamatan: tps.kecamatan,
        dapil: tps.dapil,
        jumlahSuaraSah: tps.jumlahSuaraSah,
        jumlahSuaraTidakSah: tps.jumlahSuaraTidakSah,
        jumlahTotal: tps.jumlahTotal,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "TPS_Data.xlsx"
    );

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error("Error downloading Excel file:", error);
    res
      .status(500)
      .json({ message: "Error downloading Excel file", error: error.message });
  }
};

exports.downloadExcelTPSKecamatan = async (req, res) => {
  const { kecamatan } = req.query;
  try {
    const tpsData = await TPS.find({ kecamatan }).lean();
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Data TPS");

    worksheet.columns = [
      { header: "Kode TPS", key: "kodeTPS", width: 15 },
      { header: "Desa", key: "desa", width: 20 },
      { header: "Kecamatan", key: "kecamatan", width: 20 },
      { header: "Dapil", key: "dapil", width: 15 },
      { header: "Jumlah Suara Sah", key: "jumlahSuaraSah", width: 20 },
      {
        header: "Jumlah Suara Tidak Sah",
        key: "jumlahSuaraTidakSah",
        width: 25,
      },
      { header: "Jumlah Total", key: "jumlahTotal", width: 15 },
    ];

    tpsData.forEach((tps) => {
      worksheet.addRow({
        kodeTPS: tps.kodeTPS,
        desa: tps.desa,
        kecamatan: tps.kecamatan,
        dapil: tps.dapil,
        jumlahSuaraSah: tps.jumlahSuaraSah,
        jumlahSuaraTidakSah: tps.jumlahSuaraTidakSah,
        jumlahTotal: tps.jumlahTotal,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "TPS_Data.xlsx"
    );

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error("Error downloading Excel file:", error);
    res
      .status(500)
      .json({ message: "Error downloading Excel file", error: error.message });
  }
};

exports.downloadExcelPaslonbyTPS = async (req, res) => {
  try {
    const paslons = await Paslon.find({}).sort({ noUrut: 1 }).lean();

    const tpsData = await TPS.find({}).lean();

    const suaraData = await Suara.find({})
      .populate({
        path: "tps",
        select: "kodeTPS desa kecamatan dapil",
      })
      .populate({
        path: "suaraPaslon.paslon",
        select: "noUrut",
      })
      .lean();

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("TPS Paslon Data");

    const paslonHeaders = paslons.map((paslon) => ({
      header: `${paslon.panggilan}`,
      key: `paslon${paslon.noUrut}`,
      width: 15,
    }));

    worksheet.columns = [
      { header: "Dapil", key: "dapil", width: 15 },
      { header: "Kecamatan", key: "kecamatan", width: 20 },
      { header: "Desa", key: "desa", width: 20 },
      { header: "Kode TPS", key: "kodeTPS", width: 15 },
      ...paslonHeaders,
      { header: "Total Suara Sah", key: "jumlahSuaraSah", width: 20 },
      { header: "Suara Tidak Sah", key: "jumlahSuaraTidakSah", width: 20 },
      { header: "Total Suara", key: "total", width: 15 },
    ];

    tpsData.forEach((tps) => {
      const suaraTPS = suaraData.find((suara) => suara.tps._id.equals(tps._id));

      const paslonSuara = suaraTPS
        ? suaraTPS.suaraPaslon.reduce((acc, curr) => {
            acc[`paslon${curr.paslon.noUrut}`] = curr.jumlahSuaraSah;
            return acc;
          }, {})
        : {};

      const rowData = {
        dapil: tps.dapil,
        kecamatan: tps.kecamatan,
        desa: tps.desa,
        kodeTPS: tps.kodeTPS,
        jumlahSuaraSah: tps.jumlahSuaraSah,
        jumlahSuaraTidakSah: tps.jumlahSuaraTidakSah,
        total: tps.jumlahTotal,
      };

      paslons.forEach((paslon) => {
        rowData[`paslon${paslon.noUrut}`] =
          paslonSuara[`paslon${paslon.noUrut}`] || 0;
      });

      worksheet.addRow(rowData);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="tps-paslon.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating Excel file.");
  }
};

exports.downloadExcelPaslonbyTPSKecamatan = async (req, res) => {
  const { kecamatan } = req.query;
  try {
    const paslons = await Paslon.find({}).sort({ noUrut: 1 }).lean();
    const tpsData = await TPS.find({ kecamatan }).lean();
    const suaraData = await Suara.find({})
      .populate({
        path: "tps",
        select: "kodeTPS desa kecamatan dapil",
      })
      .populate({
        path: "suaraPaslon.paslon",
        select: "noUrut",
      })
      .lean();

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("TPS Paslon Data");

    const paslonHeaders = paslons.map((paslon) => ({
      header: `${paslon.panggilan}`,
      key: `paslon${paslon.noUrut}`,
      width: 15,
    }));

    worksheet.columns = [
      { header: "Dapil", key: "dapil", width: 15 },
      { header: "Kecamatan", key: "kecamatan", width: 20 },
      { header: "Desa", key: "desa", width: 20 },
      { header: "Kode TPS", key: "kodeTPS", width: 15 },
      ...paslonHeaders,
      { header: "Total Suara Sah", key: "jumlahSuaraSah", width: 20 },
      { header: "Suara Tidak Sah", key: "jumlahSuaraTidakSah", width: 20 },
      { header: "Total Suara", key: "total", width: 15 },
    ];

    tpsData.forEach((tps) => {
      const suaraTPS = suaraData.find((suara) => suara.tps._id.equals(tps._id));

      const paslonSuara = suaraTPS
        ? suaraTPS.suaraPaslon.reduce((acc, curr) => {
            acc[`paslon${curr.paslon.noUrut}`] = curr.jumlahSuaraSah;
            return acc;
          }, {})
        : {};

      const rowData = {
        dapil: tps.dapil,
        kecamatan: tps.kecamatan,
        desa: tps.desa,
        kodeTPS: tps.kodeTPS,
        jumlahSuaraSah: tps.jumlahSuaraSah,
        jumlahSuaraTidakSah: tps.jumlahSuaraTidakSah,
        total: tps.jumlahTotal,
      };

      paslons.forEach((paslon) => {
        rowData[`paslon${paslon.noUrut}`] =
          paslonSuara[`paslon${paslon.noUrut}`] || 0;
      });

      worksheet.addRow(rowData);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="tps-paslon.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating Excel file.");
  }
};
