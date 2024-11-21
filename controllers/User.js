const User = require("../schema/User.js");
const jwt = require("jsonwebtoken");
const { checkToken } = require("../middleware/auth.js");
const upload = require("../middleware/multer.js");
const fs = require("fs").promises;
const cloudinary = require("../config/cloudinary.js");
const mongoose = require("mongoose");
const TPS = require("../schema/TPS.js");

// Fungsi untuk menghasilkan token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Daftar pengguna baru
exports.registerUser = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const user = new User({
      ...req.body,
      role: role || "user",
    });
    await user.save();
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

// Login pengguna
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  // Validasi input
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide username and password" });
  }

  try {
    const user = await User.findOne({ username });
    console.log(await user.comparePassword(password));
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = generateToken(user);
    res.status(200).json({ user, token });
  } catch (error) {
    console.log("Error logging in user:", error);
    res
      .status(500)
      .json({ message: "Error logging in user", error: error.message });
  }
};

// Update pengguna
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { username, password, role } = req.body;

  // Validasi input
  if (!username || (password && password.length < 6)) {
    return res.status(400).json({
      message:
        "Please provide all required fields, and password must be at least 6 characters long if provided.",
    });
  }

  try {
    const updates = { username, role };

    if (password) {
      updates.password = password;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

exports.attendanceUser = async (req, res) => {
  const { userId } = req.params;
  try {
    await new Promise((resolve, reject) => {
      upload.single("image")(req, res, (err) => {
        if (err) return reject({ status: 500, message: err, number: 1 });
        resolve();
      });
    });

    const { attandance } = req.body;

    let attendanceImageUrl = null;
    if (req.file) {
      const publicId = `${userId}-${Date.now()}`;
      const result = await cloudinary.uploader
        .upload(req.file.path, {
          folder: "hijisora/absensi",
          public_id: publicId,
        })
        .catch((err) => {
          console.error("Cloudinary upload error:", err);
          throw new Error("Cloudinary upload failed");
        });
      attendanceImageUrl = result.secure_url;
      await fs.unlink(req.file.path);
    }
    const userRecord = await User.findById(userId);
    if (!userRecord) {
      return res.status(404).json({ message: "User not found", number: 3 });
    }

    userRecord.attandance = attandance;
    if (attendanceImageUrl) {
      userRecord.image = attendanceImageUrl;
    }
    await userRecord.save();

    res.status(200).json({
      message: "User attandance updated successfully",
      user: userRecord,
    });
  } catch (error) {
    console.error({
      message: "Error updating user attendance:",
      error,
      number: 4,
    });
    res.status(500).json({
      message: "Error updating user attendance",
      error: error.message,
      number: 5,
    });
  }
};

exports.getUsersWithPagination = async (req, res) => {
  let { page = 0, limit = 12, ...filters } = req.query;
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  try {
    const tpsQuery = {};
    const query = {};
    let users;

    // Filter role
    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.role === "user") {
      for (const [key, value] of Object.entries(filters)) {
        if (["dapil", "kecamatan", "desa", "kodeTPS"].includes(key)) {
          tpsQuery[key] = isNaN(value)
            ? { $regex: value, $options: "i" }
            : parseInt(value, 10);
        } else {
          query[key] =
            value === "true"
              ? true
              : value === "false"
              ? false
              : isNaN(value)
              ? { $regex: value, $options: "i" }
              : parseInt(value, 10);
        }
      }

      const tps = await TPS.find(tpsQuery).select("_id");
      const tpsIds = tps.map((tp) => tp._id);
      query.tps = { $in: tpsIds };

      users = await User.find(query)
        .populate("tps")
        .limit(limit)
        .skip(page * limit)
        .exec();
    } else if (filters.role === "admin") {
      users = await User.find(query)
        .limit(limit)
        .skip(page * limit)
        .exec();
    } else {
      for (const [key, value] of Object.entries(filters)) {
        query[key] =
          value === "true"
            ? true
            : value === "false"
            ? false
            : isNaN(value)
            ? { $regex: value, $options: "i" }
            : parseInt(value, 10);
      }

      users = await User.find(query)
        .populate("tps")
        .limit(limit)
        .skip(page * limit)
        .exec();
    }

    const totalRows = await User.countDocuments(query);

    res.status(200).json({
      results: users,
      totalRows,
      page,
      limit,
      totalPage: Math.ceil(totalRows / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("tps");
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

exports.getUserByTPS = async (req, res) => {
  const { tpsId } = req.params;
  try {
    const user = await User.findOne({ tps: tpsId });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

exports.getUserByToken = async (req, res) => {
  try {
    const decoded = checkToken(req);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(200).json(null);
    }
    res.status(200).json(user);
  } catch (error) {
    return res.status(200).json(null);
  }
};
