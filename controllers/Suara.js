const mongoose = require("mongoose");
const Suara = require("../schema/Suara.js");
const cloudinary = require("../config/cloudinary.js");
const upload = require("../middleware/multer.js");
const fs = require("fs").promises;
const { uploader } = require("cloudinary").v2;
const moment = require("moment-timezone");

// Tambah Suara
exports.createSuara = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload.single("image")(req, res, (err) => {
        if (err) reject({ status: 500, message: err, to: "multer" });
        if (!req.file) reject({ status: 400, message: "No file uploaded" });
        resolve();
      });
    });

    const { tps, suaraPaslon } = req.body;
    if (!tps || !suaraPaslon || suaraPaslon.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide tps & suaraPaslon" });
    }

    const parsedSuaraPaslon = suaraPaslon.map((suara) =>
      typeof suara === "string" ? JSON.parse(suara) : suara
    );

    const publicId = `${tps}`;
    const result = await uploader.upload(req.file.path, {
      folder: "rekap_suara",
      public_id: publicId,
    });

    const suara = new Suara({
      tps,
      suaraPaslon: parsedSuaraPaslon,
      image: result.secure_url,
      user: req.user.id,
    });

    await suara.save();
    await fs.unlink(req.file.path);

    res.status(201).json({ msg: "berhasil", data: suara });
  } catch (error) {
    console.error("Server error:", error);
    if (error.status) {
      return res
        .status(error.status)
        .json({ message: error.message, to: error.to });
    }
    res
      .status(500)
      .json({ msg: error.message || "Internal server error", to: "server" });
  }
};

// Ambil Suara berdasarkan TPS

exports.getSuaraByTPS = async (req, res) => {
  try {
    const suara = await Suara.find({ tps: req.params.tpsId })
      .populate("tps")
      .populate("suaraPaslon.paslon");

    const formattedSuara = suara.map((item) => ({
      ...item._doc,
      createdAt: moment(item.createdAt)
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));

    res.status(200).json(formattedSuara);
  } catch (error) {
    console.error("Error fetching suara by TPS:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
      details: error,
      to: "server",
    });
  }
};

exports.getSuaraByUser = async (req, res) => {
  try {
    const suara = await Suara.find({ user: req.params.userId })
      .populate("tps")
      .populate("suaraPaslon.paslon");

    const formattedSuara = suara.map((item) => ({
      ...item._doc,
      createdAt: moment(item.createdAt)
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));

    res.status(200).json(formattedSuara);
  } catch (error) {
    console.error("Error fetching suara by TPS:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
      details: error,
      to: "server",
    });
  }
};

// Ambil Suara berdasarkan Paslon
exports.getSuaraByPaslon = async (req, res) => {
  try {
    const results = await Suara.aggregate([
      { $unwind: "$suaraPaslon" },
      {
        $lookup: {
          from: "paslon",
          localField: "suaraPaslon.paslon",
          foreignField: "_id",
          as: "paslonDetails",
        },
      },
      { $unwind: "$paslonDetails" },
      {
        $group: {
          _id: "$suaraPaslon.paslon",
          "Total Suara": { $sum: "$suaraPaslon.jumlahSuaraSah" },
          "Nama Calon Ketua": { $first: "$paslonDetails.namaCalonKetua" },
          "Nama Calon Wakil Ketua": { $first: "$paslonDetails.namaWakilKetua" },
          Panggilan: { $first: "$paslonDetails.panggilan" },
          "No Urut": { $first: "$paslonDetails.noUrut" },
          "Unique Users": { $addToSet: "$user" },
          "Last Updated": { $max: "$createdAt" },
        },
      },
      {
        $addFields: {
          "Total Saksi": { $size: "$Unique Users" },
        },
      },
      {
        $project: {
          "Unique Users": 0,
        },
      },
      { $sort: { "No Urut": 1 } },
    ]);

    const formattedResults = results.map((result) => ({
      _id: result._id,
      "Total Suara": result["Total Suara"],
      "Nama Calon Ketua": result["Nama Calon Ketua"],
      "Nama Calon Wakil Ketua": result["Nama Calon Wakil Ketua"],
      Panggilan: result["Panggilan"],
      "No Urut": result["No Urut"],
      "Total Saksi": result["Total Saksi"],
      "Last Updated": moment(result["Last Updated"])
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error("Error fetching suara by paslon:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
      details: error,
      to: "server",
    });
  }
};

exports.getSuaraBySpecificPaslon = async (req, res) => {
  try {
    const { paslonId } = req.params;

    if (!paslonId) {
      return res.status(400).json({
        error: "Parameter paslonId is required",
      });
    }

    const result = await Suara.aggregate([
      { $unwind: "$suaraPaslon" },
      {
        $match: {
          "suaraPaslon.paslon": new mongoose.Types.ObjectId(paslonId),
        },
      },
      {
        $lookup: {
          from: "paslon",
          localField: "suaraPaslon.paslon",
          foreignField: "_id",
          as: "paslonDetails",
        },
      },
      { $unwind: "$paslonDetails" },
      {
        $group: {
          _id: "$suaraPaslon.paslon",
          "Total Suara": { $sum: "$suaraPaslon.jumlahSuaraSah" },
          "Nama Calon Ketua": { $first: "$paslonDetails.namaCalonKetua" },
          "Nama Calon Wakil Ketua": { $first: "$paslonDetails.namaWakilKetua" },
          Panggilan: { $first: "$paslonDetails.panggilan" },
          "No Urut": { $first: "$paslonDetails.noUrut" },
          "Unique Users": { $addToSet: "$user" },
          "Last Updated": { $max: "$createdAt" },
        },
      },
      {
        $addFields: {
          "Total Saksi": { $size: "$Unique Users" },
        },
      },
      {
        $project: {
          "Unique Users": 0,
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(404).json({
        error: "Paslon not found",
      });
    }

    const formattedResult = {
      _id: result[0]._id,
      "Total Suara": result[0]["Total Suara"],
      "Nama Calon Ketua": result[0]["Nama Calon Ketua"],
      "Nama Calon Wakil Ketua": result[0]["Nama Calon Wakil Ketua"],
      Panggilan: result[0]["Panggilan"],
      "No Urut": result[0]["No Urut"],
      "Total Saksi": result[0]["Total Saksi"],
      "Last Updated": moment(result[0]["Last Updated"])
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss"),
    };

    res.status(200).json(formattedResult);
  } catch (error) {
    console.error("Error fetching suara by specific paslon:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
      details: error,
    });
  }
};
