const mongoose = require("mongoose");
const PilgubSuara = require("../schema/PilgubSuara.js");
const TPS = require("../schema/TPS.js");
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
      folder: "hijisora/pilgub/C1 PLANO",
      public_id: publicId,
    });

    const suara = new PilgubSuara({
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
  const { tpsId } = req.params;
  try {
    const suara = await PilgubSuara.find()
      .populate("tps")
      .populate("suaraPaslon.paslon");

    const tpsSuara = suara.find((i) => i.tps._id.toString() === tpsId);

    const results = {
      ...tpsSuara._doc,
      createdAt: moment(tpsSuara.createdAt)
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss"),
    };

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching suara by TPS:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
      details: error,
      to: "server",
    });
  }
};

// Ambil Suara berdasarkan User
exports.getSuaraByUser = async (req, res) => {
  try {
    const suara = await PilgubSuara.find({ user: req.params.userId })
      .populate("tps")
      .populate("suaraPaslon.paslon")
      .populate("user");

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
    const results = await PilgubSuara.aggregate([
      { $unwind: "$suaraPaslon" },
      {
        $lookup: {
          from: "pilgubPaslon",
          localField: "suaraPaslon.paslon",
          foreignField: "_id",
          as: "paslonDetails",
        },
      },
      { $unwind: "$paslonDetails" },
      {
        $group: {
          _id: "$suaraPaslon.paslon",
          "Total Suara": { $sum: "$suaraPaslon.suaraSah" },
          Ketua: { $first: "$paslonDetails.ketua" },
          "Wakil Ketua": { $first: "$paslonDetails.wakilKetua" },
          Panggilan: { $first: "$paslonDetails.panggilan" },
          "No Urut": { $first: "$paslonDetails.noUrut" },
          "Unique Users": { $addToSet: "$user" },
          "Last Updated": { $max: "$createdAt" },
        },
      },
      { $addFields: { "Total Saksi": { $size: "$Unique Users" } } },
      { $project: { "Unique Users": 0 } },
      { $sort: { "No Urut": 1 } },
    ]);

    const formattedResults = results.map((result) => ({
      _id: result._id,
      "Total Suara": result["Total Suara"],
      Ketua: result["Ketua"],
      "Wakil Ketua": result["Wakil Ketua"],
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

// Ambil Suara berdasarkan Paslon dan Kecamatan
exports.getSuaraByPaslonByKecamatan = async (req, res) => {
  try {
    const { kecamatan } = req.query;
    const results = await PilgubSuara.aggregate([
      {
        $lookup: {
          from: "tps",
          localField: "tps",
          foreignField: "_id",
          as: "tpsDetails",
        },
      },
      { $unwind: "$tpsDetails" },
      { $match: { "tpsDetails.kecamatan": kecamatan } },
      { $unwind: "$suaraPaslon" },
      {
        $lookup: {
          from: "pilgubPaslon",
          localField: "suaraPaslon.paslon",
          foreignField: "_id",
          as: "paslonDetails",
        },
      },
      { $unwind: "$paslonDetails" },
      {
        $group: {
          _id: "$suaraPaslon.paslon",
          "Total Suara": { $sum: "$suaraPaslon.suaraSah" },
          Ketua: { $first: "$paslonDetails.ketua" },
          "Wakil Ketua": { $first: "$paslonDetails.wakilKetua" },
          Panggilan: { $first: "$paslonDetails.panggilan" },
          "No Urut": { $first: "$paslonDetails.noUrut" },
          "Unique Users": { $addToSet: "$user" },
          "Last Updated": { $max: "$createdAt" },
        },
      },
      { $addFields: { "Total Saksi": { $size: "$Unique Users" } } },
      { $project: { "Unique Users": 0 } },
      { $sort: { "No Urut": 1 } },
    ]);

    const formattedResults = results.map((result) => ({
      _id: result._id,
      "Total Suara": result["Total Suara"],
      Ketua: result["Ketua"],
      "Wakil Ketua": result["Wakil Ketua"],
      Panggilan: result["Panggilan"],
      "No Urut": result["No Urut"],
      "Total Saksi": result["Total Saksi"],
      "Last Updated": moment(result["Last Updated"])
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss"),
    }));

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error(
      "Error fetching suara by paslon with kecamatan filter:",
      error
    );
    res.status(500).json({
      error: error.message || "Internal server error",
      details: error,
      to: "server",
    });
  }
};

// Ambil Suara berdasarkan Specific Paslon
exports.getSuaraBySpecificPaslon = async (req, res) => {
  try {
    const { paslonId } = req.params;
    if (!paslonId) {
      return res.status(400).json({ error: "Parameter paslonId is required" });
    }

    const result = await PilgubSuara.aggregate([
      { $unwind: "$suaraPaslon" },
      {
        $match: { "suaraPaslon.paslon": new mongoose.Types.ObjectId(paslonId) },
      },
      {
        $lookup: {
          from: "pilgubPaslon",
          localField: "suaraPaslon.paslon",
          foreignField: "_id",
          as: "paslonDetails",
        },
      },
      { $unwind: "$paslonDetails" },
      {
        $group: {
          _id: "$suaraPaslon.paslon",
          "Total Suara": { $sum: "$suaraPaslon.suaraSah" },
          Ketua: { $first: "$paslonDetails.ketua" },
          "Wakil Ketua": { $first: "$paslonDetails.wakilKetua" },
          Panggilan: { $first: "$paslonDetails.panggilan" },
          "No Urut": { $first: "$paslonDetails.noUrut" },
          "Unique Users": { $addToSet: "$user" },
          "Last Updated": { $max: "$createdAt" },
        },
      },
      { $addFields: { "Total Saksi": { $size: "$Unique Users" } } },
      { $project: { "Unique Users": 0 } },
    ]);

    if (result.length === 0) {
      return res.status(404).json({ error: "Paslon not found" });
    }

    const formattedResult = {
      _id: result[0]._id,
      "Total Suara": result[0]["Total Suara"],
      Ketua: result[0]["Ketua"],
      "Wakil Ketua": result[0]["Wakil Ketua"],
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

// Ambil Suara berdasarkan Specific Paslon dan Kecamatan
exports.getSuaraBySpecificPaslonByKecamatan = async (req, res) => {
  try {
    const { paslonId } = req.params;
    const { kecamatan } = req.query;
    if (!paslonId) {
      return res.status(400).json({ error: "Parameter paslonId is required" });
    }

    if (!kecamatan) {
      return res
        .status(400)
        .json({ error: "Query parameter kecamatan is required" });
    }

    const result = await PilgubSuara.aggregate([
      { $unwind: "$suaraPaslon" },
      {
        $match: { "suaraPaslon.paslon": new mongoose.Types.ObjectId(paslonId) },
      },
      {
        $lookup: {
          from: "tps",
          localField: "tps",
          foreignField: "_id",
          as: "tpsDetails",
        },
      },
      { $unwind: "$tpsDetails" },
      { $match: { "tpsDetails.kecamatan": kecamatan } },
      {
        $lookup: {
          from: "pilgubPaslon",
          localField: "suaraPaslon.paslon",
          foreignField: "_id",
          as: "paslonDetails",
        },
      },
      { $unwind: "$paslonDetails" },
      {
        $group: {
          _id: "$suaraPaslon.paslon",
          "Total Suara": { $sum: "$suaraPaslon.suaraSah" },
          Ketua: { $first: "$paslonDetails.ketua" },
          "Wakil Ketua": { $first: "$paslonDetails.wakilKetua" },
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
      return res
        .status(404)
        .json({ error: "Paslon not found for the specified kecamatan" });
    }

    const formattedResult = {
      _id: result[0]._id,
      "Total Suara": result[0]["Total Suara"],
      Ketua: result[0]["Ketua"],
      "Wakil Ketua": result[0]["Wakil Ketua"],
      Panggilan: result[0]["Panggilan"],
      "No Urut": result[0]["No Urut"],
      "Total Saksi": result[0]["Total Saksi"],
      "Last Updated": moment(result[0]["Last Updated"])
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss"),
    };

    res.status(200).json(formattedResult);
  } catch (error) {
    console.error(
      "Error fetching suara by specific paslon and kecamatan:",
      error
    );
    res.status(500).json({
      error: error.message || "Internal server error",
      details: error,
    });
  }
};
