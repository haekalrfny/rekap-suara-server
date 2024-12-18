const TPS = require("../schema/TPS.js");
const PilkadaSuara = require("../schema/PilkadaSuara.js");
const PilgubSuara = require("../schema/PilgubSuara.js");
const PilkadaPaslon = require("../schema/PilkadaPaslon.js");
const PilgubPaslon = require("../schema/PilgubPaslon.js");
const User = require("../schema/User.js");
const excel = require("exceljs");
const upload = require("../middleware/multer.js");
const fs = require("fs").promises;
const { uploader } = require("cloudinary").v2;
const XLSX = require("xlsx");
const mongoose = require("mongoose");

// Tambah TPS
exports.createTPS = async (req, res) => {
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

exports.getTPSById = async (req, res) => {
  const { tpsId } = req.params;

  try {
    const tps = await TPS.findById(tpsId);
    if (!tps) {
      return res.status(404).json({ message: "TPS not found" });
    }

    const pilkadaSuara = await PilkadaSuara.findOne({ tps: tps._id });
    const pilgubSuara = await PilgubSuara.findOne({ tps: tps._id });

    const tpsWithSuaraData = {
      ...tps.toObject(),
      pilkadaSuara,
      pilgubSuara,
    };

    res.status(200).json(tpsWithSuaraData);
  } catch (error) {
    console.error("Error fetching TPS by ID:", error);
    res.status(500).json({
      message: "Error fetching TPS by ID",
      error: error.message,
    });
  }
};

exports.updateTPS = async (req, res) => {
  const { tpsId } = req.params;

  if (!req.body) {
    return res
      .status(400)
      .json({ message: "Please provide the fields to update" });
  }

  try {
    const tps = await TPS.findById(tpsId);
    if (!tps) {
      return res.status(404).json({ message: "TPS not found" });
    }

    const updatedData = { ...req.body };

    const updatedTPS = await TPS.findByIdAndUpdate(tpsId, updatedData, {
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

exports.updateTPSAndPilgub = async (req, res) => {
  const { tpsId } = req.params;
  const {
    pilgubPaslon,
    kertasSuara,
    suaraSah,
    suaraTidakSah,
    suaraTidakTerpakai,
  } = req.body;

  try {
    let imageUrl = null;

    if (req.file) {
      await new Promise((resolve, reject) => {
        upload.single("image")(req, res, (err) => {
          if (err) reject({ status: 500, message: err, to: "multer" });
          resolve();
        });
      });

      const publicId = `pilgub_${tpsId}`;
      const uploadResult = await uploader.upload(req.file.path, {
        folder: "hijisora/pilgub/UPDATE",
        public_id: publicId,
      });
      imageUrl = uploadResult.secure_url;

      // Hapus file lokal setelah upload
      await fs.unlink(req.file.path);
    }

    const tps = await TPS.findById(tpsId);
    if (!tps) {
      return res.status(404).json({ message: "TPS not found" });
    }

    // Update TPS data
    const updateTPS = await TPS.updateOne(
      { _id: tpsId },
      {
        $set: {
          "pilgub.kertasSuara": kertasSuara,
          "pilgub.suaraSah": suaraSah,
          "pilgub.suaraTidakSah": suaraTidakSah,
          "pilgub.suaraTidakTerpakai": suaraTidakTerpakai,
        },
      }
    );

    // Update PilgubSuara data
    const updatePilgubSuara = await PilgubSuara.updateOne(
      { tps: tpsId },
      {
        $set: {
          suaraPaslon: pilgubPaslon,
          ...(imageUrl && { image: imageUrl }), // Hanya update image jika ada
        },
      }
    );

    res.status(200).json({
      message: "Update successful",
      updateTPS,
      updatePilgubSuara,
    });
  } catch (error) {
    console.error("Error updating TPS:", error);
    if (error.status) {
      return res
        .status(error.status)
        .json({ message: error.message, to: error.to });
    }
    res.status(500).json({
      message: error.message || "Error updating TPS",
      to: "server",
    });
  }
};

exports.updateTPSAndPilbup = async (req, res) => {
  const { tpsId } = req.params;
  const {
    pilkadaPaslon,
    kertasSuara,
    suaraSah,
    suaraTidakSah,
    suaraTidakTerpakai,
  } = req.body;

  try {
    let imageUrl = null;

    if (req.file) {
      await new Promise((resolve, reject) => {
        upload.single("image")(req, res, (err) => {
          if (err) reject({ status: 500, message: err, to: "multer" });
          resolve();
        });
      });

      const publicId = `pilbup_${tpsId}`;
      const uploadResult = await uploader.upload(req.file.path, {
        folder: "hijisora/pilbup/UPDATE",
        public_id: publicId,
      });
      imageUrl = uploadResult.secure_url;
      await fs.unlink(req.file.path);
    }

    const tps = await TPS.findById(tpsId);
    if (!tps) {
      return res.status(404).json({ message: "TPS not found" });
    }

    // Update TPS data
    const updateTPS = await TPS.updateOne(
      { _id: tpsId },
      {
        $set: {
          "pilkada.kertasSuara": kertasSuara,
          "pilkada.suaraSah": suaraSah,
          "pilkada.suaraTidakSah": suaraTidakSah,
          "pilkada.suaraTidakTerpakai": suaraTidakTerpakai,
        },
      }
    );

    // Update PilgubSuara data
    const updatePilbupSuara = await PilkadaSuara.updateOne(
      { tps: tpsId },
      {
        $set: {
          suaraPaslon: pilkadaPaslon,
          ...(imageUrl && { image: imageUrl }),
        },
      }
    );

    console.log(imageUrl);
    res.status(200).json({
      message: "Update successful",
      updateTPS,
      updatePilbupSuara,
    });

    console.log(pilkadaPaslon, suaraSah, suaraTidakSah, suaraTidakTerpakai);
  } catch (error) {
    console.error("Error updating TPS:", error);
    if (error.status) {
      return res
        .status(error.status)
        .json({ message: error.message, to: error.to });
    }
    res.status(500).json({
      message: error.message || "Error updating TPS",
      to: "server",
    });
  }
};

exports.getTPSWithPagination = async (req, res) => {
  let { page = 0, limit = 12, ...filters } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const query = {};

  for (const [key, value] of Object.entries(filters)) {
    if (key === "pilbup") {
      if (value === "true") {
        query["pilkada.suaraSah"] = { $exists: true };
        query["pilkada.suaraTidakSah"] = { $exists: true };
        query["pilkada.suaraTidakTerpakai"] = { $exists: true };
      } else if (value === "false") {
        query["pilkada"] = { $exists: false };
      }
    } else if (key === "pilgub") {
      if (value === "true") {
        query["pilgub.suaraSah"] = { $exists: true };
        query["pilgub.suaraTidakSah"] = { $exists: true };
        query["pilgub.suaraTidakTerpakai"] = { $exists: true };
      } else if (value === "false") {
        query["pilgub"] = { $exists: false };
      }
    } else if (isNaN(value)) {
      query[key] = { $regex: value, $options: "i" };
    } else {
      query[key] = parseInt(value, 10);
    }
  }

  try {
    const tpsData = await TPS.find(query)
      .limit(limit)
      .skip(page * limit)
      .exec();

    const tpsWithSuaraData = await Promise.all(
      tpsData.map(async (tps) => {
        const pilkadaSuara = await PilkadaSuara.findOne({ tps: tps._id });
        const pilgubSuara = await PilgubSuara.findOne({ tps: tps._id });

        return {
          ...tps.toObject(),
          pilkadaSuara,
          pilgubSuara,
        };
      })
    );

    const totalRows = await TPS.countDocuments(query);
    res.status(200).json({
      results: tpsWithSuaraData,
      page,
      limit,
      totalRows,
      totalPage: Math.ceil(totalRows / limit),
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
  const { tpsId } = req.params;
  if (!tpsId) {
    return res.status(400).json({ message: "TPS ID is required" });
  }

  try {
    const user = await User.findOne({ tps: tpsId });
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

// Dapil Pilkada
exports.getDapilWithSuaraPilkada = async (req, res) => {
  try {
    const result = await TPS.aggregate([
      {
        $group: { _id: "$dapil", totalSuara: { $sum: "$pilkada.suaraSah" } },
      },
      {
        $project: {
          _id: 0,
          dapil: "$_id",
          suara: "$totalSuara",
        },
      },
      { $sort: { dapil: 1 } },
    ]);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching dapil data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Dapil Pilgub
exports.getDapilWithSuaraPilgub = async (req, res) => {
  try {
    const result = await TPS.aggregate([
      {
        $group: { _id: "$dapil", totalSuara: { $sum: "$pilgub.suaraSah" } },
      },
      {
        $project: {
          _id: 0,
          dapil: "$_id",
          suara: "$totalSuara",
        },
      },
      { $sort: { dapil: 1 } },
    ]);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching dapil data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.downloadExcelTPS = async (req, res) => {
  const { ...filters } = req.query;

  try {
    const query = {};
    for (const [key, value] of Object.entries(filters)) {
      if (key === "pilbup") {
        if (value === "true") {
          query["pilkada.suaraSah"] = { $exists: true };
          query["pilkada.suaraTidakSah"] = { $exists: true };
          query["pilkada.suaraTidakTerpakai"] = { $exists: true };
        } else if (value === "false") {
          query["pilkada"] = { $exists: false };
        }
      } else if (key === "pilgub") {
        if (value === "true") {
          query["pilgub.suaraSah"] = { $exists: true };
          query["pilgub.suaraTidakSah"] = { $exists: true };
          query["pilgub.suaraTidakTerpakai"] = { $exists: true };
        } else if (value === "false") {
          query["pilgub"] = { $exists: false };
        }
      } else if (isNaN(value)) {
        query[key] = { $regex: value, $options: "i" };
      } else {
        query[key] = parseInt(value, 10);
      }
    }

    const tpsData = await TPS.find(query).lean();
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Data TPS");

    worksheet.columns = [
      { header: "Kode TPS", key: "kodeTPS", width: 15 },
      { header: "Desa", key: "desa", width: 20 },
      { header: "Kecamatan", key: "kecamatan", width: 20 },
      { header: "Dapil", key: "dapil", width: 15 },
      { header: "Pilkada - Suara Sah", key: "pilkadaSuaraSah", width: 20 },
      {
        header: "Pilkada - Suara Tidak Sah",
        key: "pilkadaSuaraTidakSah",
        width: 25,
      },
      {
        header: "Pilkada - Suara Tidak Terpakai",
        key: "pilkadaSuaraTidakTerpakai",
        width: 25,
      },
      {
        header: "Pilkada - Kertas Suara",
        key: "pilkadaKertasSuara",
        width: 20,
      },
      { header: "Pilgub - Suara Sah", key: "pilgubSuaraSah", width: 20 },
      {
        header: "Pilgub - Suara Tidak Sah",
        key: "pilgubSuaraTidakSah",
        width: 25,
      },
      {
        header: "Pilgub - Suara Tidak Terpakai",
        key: "pilgubSuaraTidakTerpakai",
        width: 25,
      },
      { header: "Pilgub - Kertas Suara", key: "pilgubKertasSuara", width: 20 },
    ];

    tpsData.forEach((tps) => {
      worksheet.addRow({
        kodeTPS: tps.kodeTPS,
        desa: tps.desa,
        kecamatan: tps.kecamatan,
        dapil: tps.dapil,
        pilkadaSuaraSah: tps.pilkada?.suaraSah,
        pilkadaSuaraTidakSah: tps.pilkada?.suaraTidakSah,
        pilkadaSuaraTidakTerpakai: tps.pilkada?.suaraTidakTerpakai,
        pilkadaKertasSuara: tps.pilkada?.kertasSuara,
        pilgubSuaraSah: tps.pilgub?.suaraSah,
        pilgubSuaraTidakSah: tps.pilgub?.suaraTidakSah,
        pilgubSuaraTidakTerpakai: tps.pilgub?.suaraTidakTerpakai,
        pilgubKertasSuara: tps.pilgub?.kertasSuara,
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
  const { ...filters } = req.query;
  try {
    const query = {};
    for (const [key, value] of Object.entries(filters)) {
      if (key === "pilbup") {
        if (value === "true") {
          query["pilkada"] = { $exists: true };
        } else if (value === "false") {
          query["pilkada"] = { $exists: false };
        }
      } else if (key === "pilgub") {
        if (value === "true") {
          query["pilgub"] = { $exists: true };
        } else if (value === "false") {
          query["pilgub"] = { $exists: false };
        }
      } else if (isNaN(value)) {
        query[key] = { $regex: value, $options: "i" };
      } else {
        query[key] = parseInt(value, 10);
      }
    }

    const tpsData = await TPS.find(query).lean();
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Data TPS");

    worksheet.columns = [
      { header: "Kode TPS", key: "kodeTPS", width: 15 },
      { header: "Desa", key: "desa", width: 20 },
      { header: "Kecamatan", key: "kecamatan", width: 20 },
      { header: "Dapil", key: "dapil", width: 15 },
      { header: "Pilkada - Suara Sah", key: "pilkadaSuaraSah", width: 20 },
      {
        header: "Pilkada - Suara Tidak Sah",
        key: "pilkadaSuaraTidakSah",
        width: 25,
      },
      {
        header: "Pilkada - Suara Tidak Terpakai",
        key: "pilkadaSuaraTidakTerpakai",
        width: 25,
      },
      {
        header: "Pilkada - Kertas Suara",
        key: "pilkadaKertasSuara",
        width: 20,
      },
      { header: "Pilgub - Suara Sah", key: "pilgubSuaraSah", width: 20 },
      {
        header: "Pilgub - Suara Tidak Sah",
        key: "pilgubSuaraTidakSah",
        width: 25,
      },
      {
        header: "Pilgub - Suara Tidak Terpakai",
        key: "pilgubSuaraTidakTerpakai",
        width: 25,
      },
      { header: "Pilgub - Kertas Suara", key: "pilgubKertasSuara", width: 20 },
    ];

    tpsData.forEach((tps) => {
      worksheet.addRow({
        kodeTPS: tps.kodeTPS,
        desa: tps.desa,
        kecamatan: tps.kecamatan,
        dapil: tps.dapil,
        pilkadaSuaraSah: tps.pilkada?.suaraSah,
        pilkadaSuaraTidakSah: tps.pilkada?.suaraTidakSah,
        pilkadaSuaraTidakTerpakai: tps.pilkada?.suaraTidakTerpakai,
        pilkadaKertasSuara: tps.pilkada?.kertasSuara,
        pilgubSuaraSah: tps.pilgub?.suaraSah,
        pilgubSuaraTidakSah: tps.pilgub?.suaraTidakSah,
        pilgubSuaraTidakTerpakai: tps.pilgub?.suaraTidakTerpakai,
        pilgubKertasSuara: tps.pilgub?.kertasSuara,
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

exports.downloadExcelPaslonbyTPSPilkada = async (req, res) => {
  const { ...filters } = req.query;
  const query = {};

  for (const [key, value] of Object.entries(filters)) {
    if (isNaN(value)) {
      query[key] = { $regex: value, $options: "i" };
    } else {
      query[key] = parseInt(value, 10);
    }
  }

  try {
    const paslonData = await PilkadaPaslon.find({}).sort({ noUrut: 1 }).lean();
    const suaraData = await PilkadaSuara.find({})
      .populate({
        path: "tps",
        select: "kodeTPS desa kecamatan dapil pilkada",
      })
      .populate({
        path: "suaraPaslon.paslon",
        select: "noUrut",
      })
      .lean();
    const tpsData = await TPS.find(query).lean();

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("TPS Paslon Data");

    const paslonHeaders = paslonData.map((paslon) => ({
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
      { header: "Suara Sah", key: "suaraSah", width: 20 },
      { header: "Suara Tidak Sah", key: "suaraTidakSah", width: 20 },
      {
        header: "Suara Tidak Terpakai",
        key: "suaraTidakTerpakai",
        width: 20,
      },
      { header: "Kertas Suara", key: "kertasSuara", width: 15 },
    ];

    tpsData.forEach((tps) => {
      const suaraTPS = suaraData.find((suara) => suara.tps._id.equals(tps._id));

      const paslonSuara = suaraTPS
        ? suaraTPS.suaraPaslon.reduce((acc, curr) => {
            acc[`paslon${curr.paslon.noUrut}`] = curr.suaraSah;
            return acc;
          }, {})
        : {};

      const rowData = {
        dapil: tps.dapil,
        kecamatan: tps.kecamatan,
        desa: tps.desa,
        kodeTPS: tps.kodeTPS,
        suaraSah: tps.pilkada?.suaraSah,
        suaraTidakSah: tps.pilkada?.suaraTidakSah,
        suaraTidakTerpakai: tps.pilkada?.suaraTidakTerpakai,
        kertasSuara: tps.pilkada?.kertasSuara,
      };

      paslonData.forEach((paslon) => {
        rowData[`paslon${paslon.noUrut}`] =
          paslonSuara[`paslon${paslon.noUrut}`] || "";
      });

      worksheet.addRow(rowData);
      console.log(tps);
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

exports.downloadExcelPaslonbyTPSPilgub = async (req, res) => {
  const { ...filters } = req.query;
  const query = {};

  for (const [key, value] of Object.entries(filters)) {
    if (isNaN(value)) {
      query[key] = { $regex: value, $options: "i" };
    } else {
      query[key] = parseInt(value, 10);
    }
  }

  try {
    const paslonData = await PilgubPaslon.find({}).sort({ noUrut: 1 }).lean();
    const suaraData = await PilgubSuara.find({})
      .populate({
        path: "tps",
        select: "kodeTPS desa kecamatan dapil pilkada",
      })
      .populate({
        path: "suaraPaslon.paslon",
        select: "noUrut",
      })
      .lean();
    const tpsData = await TPS.find(query).lean();

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("TPS Paslon Data");

    const paslonHeaders = paslonData.map((paslon) => ({
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
      { header: "Suara Sah", key: "suaraSah", width: 20 },
      { header: "Suara Tidak Sah", key: "suaraTidakSah", width: 20 },
      {
        header: "Suara Tidak Terpakai",
        key: "suaraTidakTerpakai",
        width: 20,
      },
      { header: "Kertas Suara", key: "kertasSuara", width: 15 },
    ];

    tpsData.forEach((tps) => {
      const suaraTPS = suaraData.find((suara) => suara.tps._id.equals(tps._id));

      const paslonSuara = suaraTPS
        ? suaraTPS.suaraPaslon.reduce((acc, curr) => {
            acc[`paslon${curr.paslon.noUrut}`] = curr.suaraSah;
            return acc;
          }, {})
        : {};

      const rowData = {
        dapil: tps.dapil,
        kecamatan: tps.kecamatan,
        desa: tps.desa,
        kodeTPS: tps.kodeTPS,
        suaraSah: tps.pilgub?.suaraSah,
        suaraTidakSah: tps.pilgub?.suaraTidakSah,
        suaraTidakTerpakai: tps.pilgub?.suaraTidakTerpakai,
        kertasSuara: tps.pilgub?.kertasSuara,
      };

      paslonData.forEach((paslon) => {
        rowData[`paslon${paslon.noUrut}`] =
          paslonSuara[`paslon${paslon.noUrut}`] || "";
      });

      worksheet.addRow(rowData);
      console.log(tps);
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

exports.downloadExcelPaslonbyTPSKecamatanPilkada = async (req, res) => {
  const { kecamatan, ...filters } = req.query;
  const query = {};

  for (const [key, value] of Object.entries(filters)) {
    if (isNaN(value)) {
      query[key] = { $regex: value, $options: "i" };
    } else {
      query[key] = parseInt(value, 10);
    }
  }

  try {
    const paslonData = await PilkadaPaslon.find({}).sort({ noUrut: 1 }).lean();
    const suaraData = await PilkadaSuara.find()
      .populate({
        path: "tps",
        select: "kodeTPS desa kecamatan dapil pilkada",
      })
      .populate({
        path: "suaraPaslon.paslon",
        select: "noUrut",
      })
      .lean();

    const filteredSuara = suaraData.filter(
      (i) => i.tps?.kecamatan === kecamatan
    );

    const tpsData = await TPS.find({ kecamatan, ...query })
      .lean()
      .sort({ dapil: 1, kecamatan: 1, desa: 1, kodeTPS: 1 });

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("TPS Paslon Data");

    const paslonHeaders = paslonData.map((paslon) => ({
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
      { header: "Suara Sah", key: "suaraSah", width: 20 },
      { header: "Suara Tidak Sah", key: "suaraTidakSah", width: 20 },
      {
        header: "Suara Tidak Terpakai",
        key: "suaraTidakTerpakai",
        width: 20,
      },
      { header: "Kertas Suara", key: "kertasSuara", width: 15 },
    ];

    tpsData.forEach((tps) => {
      const suaraTPS = filteredSuara.find((suara) =>
        suara.tps._id.equals(tps._id)
      );

      const paslonSuara = suaraTPS
        ? suaraTPS.suaraPaslon.reduce((acc, curr) => {
            acc[`paslon${curr.paslon.noUrut}`] = curr.suaraSah;
            return acc;
          }, {})
        : {};

      const rowData = {
        dapil: tps.dapil,
        kecamatan: tps.kecamatan,
        desa: tps.desa,
        kodeTPS: tps.kodeTPS,
        suaraSah: tps.pilkada?.suaraSah,
        suaraTidakSah: tps.pilkada?.suaraTidakSah,
        suaraTidakTerpakai: tps.pilkada?.suaraTidakTerpakai,
        kertasSuara: tps.pilkada?.kertasSuara,
      };

      paslonData.forEach((paslon) => {
        rowData[`paslon${paslon.noUrut}`] =
          paslonSuara[`paslon${paslon.noUrut}`] || "";
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

exports.downloadExcelPaslonbyTPSKecamatanPilgub = async (req, res) => {
  const { kecamatan, ...filters } = req.query;
  const query = {};

  for (const [key, value] of Object.entries(filters)) {
    if (isNaN(value)) {
      query[key] = { $regex: value, $options: "i" };
    } else {
      query[key] = parseInt(value, 10);
    }
  }

  try {
    const paslonData = await PilgubPaslon.find({}).sort({ noUrut: 1 }).lean();
    const suaraData = await PilgubSuara.find()
      .populate({
        path: "tps",
        select: "kodeTPS desa kecamatan dapil pilkada",
      })
      .populate({
        path: "suaraPaslon.paslon",
        select: "noUrut",
      })
      .lean();

    const filteredSuara = suaraData.filter(
      (i) => i.tps?.kecamatan === kecamatan
    );

    const tpsData = await TPS.find({ kecamatan, ...query })
      .lean()
      .sort({ dapil: 1, kecamatan: 1, desa: 1, kodeTPS: 1 });

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("TPS Paslon Data");

    const paslonHeaders = paslonData.map((paslon) => ({
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
      { header: "Suara Sah", key: "suaraSah", width: 20 },
      { header: "Suara Tidak Sah", key: "suaraTidakSah", width: 20 },
      {
        header: "Suara Tidak Terpakai",
        key: "suaraTidakTerpakai",
        width: 20,
      },
      { header: "Kertas Suara", key: "kertasSuara", width: 15 },
    ];

    tpsData.forEach((tps) => {
      const suaraTPS = filteredSuara.find((suara) =>
        suara.tps._id.equals(tps._id)
      );

      const paslonSuara = suaraTPS
        ? suaraTPS.suaraPaslon.reduce((acc, curr) => {
            acc[`paslon${curr.paslon.noUrut}`] = curr.suaraSah;
            return acc;
          }, {})
        : {};

      const rowData = {
        dapil: tps.dapil,
        kecamatan: tps.kecamatan,
        desa: tps.desa,
        kodeTPS: tps.kodeTPS,
        suaraSah: tps.pilgub?.suaraSah,
        suaraTidakSah: tps.pilgub?.suaraTidakSah,
        suaraTidakTerpakai: tps.pilgub?.suaraTidakTerpakai,
        kertasSuara: tps.pilgub?.kertasSuara,
      };

      paslonData.forEach((paslon) => {
        rowData[`paslon${paslon.noUrut}`] =
          paslonSuara[`paslon${paslon.noUrut}`] || "";
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

exports.getReportAllDaerah = async (req, res) => {
  try {
    const totalDapilWithSuaraPilkada = await TPS.aggregate([
      { $unwind: "$pilkada" },
      { $match: { "pilkada.suaraSah": { $gt: 0 } } },
      { $group: { _id: "$dapil" } },
    ]);

    const totalDapilWithSuaraPilgub = await TPS.aggregate([
      { $unwind: "$pilgub" },
      { $match: { "pilgub.suaraSah": { $gt: 0 } } },
      { $group: { _id: "$dapil" } },
    ]);

    const totalDapil = await TPS.distinct("dapil");

    const totalKecamatanWithSuaraPilkada = await TPS.aggregate([
      { $unwind: "$pilkada" },
      { $match: { "pilkada.suaraSah": { $gt: 0 } } },
      { $group: { _id: "$kecamatan" } },
    ]);

    const totalKecamatanWithSuaraPilgub = await TPS.aggregate([
      { $unwind: "$pilgub" },
      { $match: { "pilgub.suaraSah": { $gt: 0 } } },
      { $group: { _id: "$kecamatan" } },
    ]);

    const totalKecamatan = await TPS.distinct("kecamatan");

    const totalDesaWithSuaraPilkada = await TPS.aggregate([
      { $unwind: "$pilkada" },
      { $match: { "pilkada.suaraSah": { $gt: 0 } } },
      { $group: { _id: { desa: "$desa", kecamatan: "$kecamatan" } } },
    ]);

    const totalDesaWithSuaraPilgub = await TPS.aggregate([
      { $unwind: "$pilgub" },
      { $match: { "pilgub.suaraSah": { $gt: 0 } } },
      { $group: { _id: { desa: "$desa", kecamatan: "$kecamatan" } } },
    ]);

    const totalDesaWithKecamatan = await TPS.aggregate([
      {
        $group: {
          _id: { desa: "$desa", kecamatan: "$kecamatan" },
        },
      },
    ]);

    const totalDesa = totalDesaWithKecamatan.length;

    const totalTPSWithSuaraPilkada = await PilkadaSuara.countDocuments();
    const totalTPSWithSuaraPilgub = await PilgubSuara.countDocuments();
    const totalTPS = await TPS.countDocuments();

    const totalSaksiWithSuaraPilkada = await PilkadaSuara.countDocuments();
    const totalSaksiWithSuaraPilgub = await PilgubSuara.countDocuments();
    const totalSaksi = await User.countDocuments({ role: "user" });

    res.status(200).json({
      dapil: {
        total: totalDapil.length,
        withSuara: {
          pilkada: totalDapilWithSuaraPilkada.length,
          pilgub: totalDapilWithSuaraPilgub.length,
        },
      },
      kecamatan: {
        total: totalKecamatan.length,
        withSuara: {
          pilkada: totalKecamatanWithSuaraPilkada.length,
          pilgub: totalKecamatanWithSuaraPilgub.length,
        },
      },
      desa: {
        total: totalDesa,
        withSuara: {
          pilkada: totalDesaWithSuaraPilkada.length,
          pilgub: totalDesaWithSuaraPilgub.length,
        },
      },
      tps: {
        total: totalTPS,
        withSuara: {
          pilkada: totalTPSWithSuaraPilkada,
          pilgub: totalTPSWithSuaraPilgub,
        },
      },
      saksi: {
        total: totalSaksi,
        withSuara: {
          pilkada: totalSaksiWithSuaraPilkada,
          pilgub: totalSaksiWithSuaraPilgub,
        },
      },
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

  if (!kecamatan) {
    return res.status(400).json({ message: "Kecamatan is required" });
  }

  try {
    const tpsList = await TPS.find({ kecamatan });
    const totalDesa = new Set(tpsList.map((tps) => tps.desa)).size;

    // Suara Pilkada untuk kecamatan ini
    const suaraTPSPilkada = await PilkadaSuara.find({
      tps: { $in: tpsList.map((tps) => tps._id) },
    }).populate("tps");

    // Suara Pilgub untuk kecamatan ini
    const suaraTPSPilgub = await PilgubSuara.find({
      tps: { $in: tpsList.map((tps) => tps._id) },
    }).populate("tps");

    // Menghitung total desa dengan suara untuk pilkada dan pilgub
    const desaWithSuaraPilkada = suaraTPSPilkada
      .filter((suara) => suara.tps && suara.tps.desa)
      .map((suara) => suara.tps.desa);
    const totalDesaWithSuaraPilkada = new Set(desaWithSuaraPilkada).size;

    const desaWithSuaraPilgub = suaraTPSPilgub
      .filter((suara) => suara.tps && suara.tps.desa)
      .map((suara) => suara.tps.desa);
    const totalDesaWithSuaraPilgub = new Set(desaWithSuaraPilgub).size;

    // Menghitung total TPS dengan suara untuk pilkada dan pilgub
    const totalTPS = tpsList.length;
    const totalTPSWithSuaraPilkada = new Set(
      suaraTPSPilkada.map((suara) => suara.tps._id.toString())
    ).size;
    const totalTPSWithSuaraPilgub = new Set(
      suaraTPSPilgub.map((suara) => suara.tps._id.toString())
    ).size;

    const totalSaksiWithSuaraPilkada = new Set(
      suaraTPSPilkada.map((suara) => suara.user.toString())
    ).size;
    const totalSaksiWithSuaraPilgub = new Set(
      suaraTPSPilgub.map((suara) => suara.user.toString())
    ).size;

    res.status(200).json({
      desa: {
        total: totalDesa,
        withSuara: {
          pilkada: totalDesaWithSuaraPilkada,
          pilgub: totalDesaWithSuaraPilgub,
        },
      },
      tps: {
        total: totalTPS,
        withSuara: {
          pilkada: totalTPSWithSuaraPilkada,
          pilgub: totalTPSWithSuaraPilgub,
        },
      },
      saksi: {
        total: totalTPS,
        withSuara: {
          pilkada: totalSaksiWithSuaraPilkada,
          pilgub: totalSaksiWithSuaraPilgub,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching report by kecamatan:", error);
    res.status(500).json({
      message: "Error fetching report by kecamatan",
      error: error.message,
    });
  }
};

// need to fix
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

exports.getDapil = async (req, res) => {
  try {
    const dapilList = await TPS.distinct("dapil");
    res.status(200).json(dapilList);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching dapil", error: error.message });
  }
};

exports.getKecamatan = async (req, res) => {
  const { dapil } = req.query;
  try {
    const kecamatanList = await TPS.distinct(
      "kecamatan",
      dapil ? { dapil } : {}
    );
    res.status(200).json(kecamatanList);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching kecamatan", error: error.message });
  }
};

exports.getDesa = async (req, res) => {
  const { dapil, kecamatan } = req.query;
  try {
    const filter = {};
    if (dapil) filter.dapil = dapil;
    if (kecamatan) filter.kecamatan = kecamatan;

    const desaList = await TPS.distinct("desa", filter);
    res.status(200).json(desaList);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching desa", error: error.message });
  }
};

exports.getKodeTPS = async (req, res) => {
  const { dapil, kecamatan, desa } = req.query;
  try {
    const tpsList = await TPS.distinct("kodeTPS", { dapil, kecamatan, desa });
    res.status(200).json(tpsList);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching desa", error: error.message });
  }
};

exports.getDapilByKecamatan = async (req, res) => {
  const { kecamatan } = req.query;
  try {
    const dapil = await TPS.aggregate([
      { $match: { kecamatan: kecamatan } },
      { $group: { _id: "$dapil" } },
      { $project: { _id: 0, dapil: "$_id" } },
    ]);

    if (dapil.length > 0) {
      res.status(200).json(`${dapil[0].dapil}`);
    } else {
      res
        .status(404)
        .json({ message: "Dapil not found for the given kecamatan" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching dapil", error: error.message });
  }
};

exports.createTPSPilbupFromExcel = async (req, res) => {
  try {
    const { excel } = req.files;

    if (
      excel.mimetype !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      fs.unlinkSync(excel.tempFilePath);
      return res
        .status(400)
        .json({ message: "Invalid file format. Please upload an Excel file." });
    }

    const workbook = XLSX.readFile(excel.tempFilePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const skippedTPS = [];

    const paslonIds = {
      Dilan: new mongoose.Types.ObjectId("66fe1c058ce429c55a4468ad"),
      Berjamaah: new mongoose.Types.ObjectId("66fe1c988ce429c55a4468af"),
      Hade: new mongoose.Types.ObjectId("66fe1cad8ce429c55a4468b1"),
      Edun: new mongoose.Types.ObjectId("66fe419f50a6677a17ab8985"),
      Berdaya: new mongoose.Types.ObjectId("66ff5cdfc7fbf4d64d60f1fe"),
    };

    for (const item of data) {
      const filter = {
        dapil: item["Dapil"],
        kecamatan: item["Kecamatan"],
        desa: item["Desa"],
        kodeTPS: item["Kode TPS"],
      };

      const updateData = {
        pilkada: {
          suaraSah: item["Suara Sah"] || 0,
          suaraTidakSah: item["Suara Tidak Sah"] || 0,
          suaraTidakTerpakai: item["Suara Tidak Terpakai"] || 0,
          kertasSuara: item["Kertas Suara"] || 0,
        },
      };

      const tps = await TPS.findOne(filter).populate("pilkada");

      if (tps) {
        if (tps.pilkada) {
          const existingPilgub = tps.pilkada;
          updateData.pilkada._id = existingPilgub._id;
          updateData.pilkada.user = existingPilgub.user;
        }

        await TPS.updateOne(filter, { $set: updateData });

        const suaraPaslon = [
          { paslon: paslonIds.Dilan, suaraSah: item["Dilan"] || 0 },
          { paslon: paslonIds.Berjamaah, suaraSah: item["Berjamaah"] || 0 },
          { paslon: paslonIds.Hade, suaraSah: item["Hade"] || 0 },
          { paslon: paslonIds.Edun, suaraSah: item["Edun"] || 0 },
          { paslon: paslonIds.Berdaya, suaraSah: item["Berdaya"] || 0 },
        ];

        const existingSuara = await PilkadaSuara.findOne({ tps: tps._id });

        if (existingSuara) {
          await PilkadaSuara.updateOne(
            { tps: tps._id },
            { $set: { suaraPaslon } }
          );
        } else {
          await PilkadaSuara.create({
            tps: tps._id,
            suaraPaslon,
            user: req.user.id,
          });
        }
      } else {
        skippedTPS.push(filter);
      }
    }

    await fs.unlink(excel.tempFilePath);
    res.status(200).json({
      message: "Data TPS and Suara successfully updated.",
      skippedTPS,
      skippedCount: skippedTPS.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating TPS and Suara from Excel",
      error: error.message,
    });
  }
};

exports.createTPSPilgubFromExcel = async (req, res) => {
  try {
    const { excel } = req.files;

    if (
      excel.mimetype !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      fs.unlinkSync(excel.tempFilePath);
      return res
        .status(400)
        .json({ message: "Invalid file format. Please upload an Excel file." });
    }

    const workbook = XLSX.readFile(excel.tempFilePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const skippedTPS = [];

    const paslonIds = {
      "Acep-Gita": new mongoose.Types.ObjectId("672b5780a040ba94fdb7f915"),
      "Jeje-Ronal": new mongoose.Types.ObjectId("672b5780a040ba94fdb7f916"),
      Asih: new mongoose.Types.ObjectId("672b5780a040ba94fdb7f914"),
      "Dedi-Erwan": new mongoose.Types.ObjectId("672b5780a040ba94fdb7f913"),
    };

    for (const item of data) {
      const filter = {
        dapil: item["Dapil"],
        kecamatan: item["Kecamatan"],
        desa: item["Desa"],
        kodeTPS: item["Kode TPS"],
      };

      const updateData = {
        pilgub: {
          suaraSah: item["Suara Sah"] || 0,
          suaraTidakSah: item["Suara Tidak Sah"] || 0,
          suaraTidakTerpakai: item["Suara Tidak Terpakai"] || 0,
          kertasSuara: item["Kertas Suara"] || 0,
        },
      };

      const tps = await TPS.findOne(filter).populate("pilgub");

      if (tps) {
        if (tps.pilgub) {
          const existingPilgub = tps.pilgub;
          updateData.pilgub._id = existingPilgub._id;
          updateData.pilgub.user = existingPilgub.user;
        }

        await TPS.updateOne(filter, { $set: updateData });

        const suaraPaslon = [
          { paslon: paslonIds["Acep-Gita"], suaraSah: item["Acep-Gita"] || 0 },
          {
            paslon: paslonIds["Jeje-Ronal"],
            suaraSah: item["Jeje-Ronal"] || 0,
          },
          { paslon: paslonIds.Asih, suaraSah: item["Asih"] || 0 },
          {
            paslon: paslonIds["Dedi-Erwan"],
            suaraSah: item["Dedi-Erwan"] || 0,
          },
        ];

        const existingSuara = await PilgubSuara.findOne({ tps: tps._id });

        if (existingSuara) {
          await PilgubSuara.updateOne(
            { tps: tps._id },
            { $set: { suaraPaslon } }
          );
        } else {
          await PilgubSuara.create({
            tps: tps._id,
            suaraPaslon,
            user: req.user.id,
          });
        }
      } else {
        skippedTPS.push(filter);
      }
    }

    await fs.unlink(excel.tempFilePath);
    res.status(200).json({
      message: "Data TPS and Suara successfully updated.",
      skippedTPS,
      skippedCount: skippedTPS.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating TPS and Suara from Excel",
      error: error.message,
    });
  }
};
