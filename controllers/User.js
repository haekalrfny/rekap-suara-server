const User = require("../schema/User.js");
const jwt = require("jsonwebtoken");
const { checkToken } = require("../middleware/auth.js");

// Fungsi untuk menghasilkan token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Daftar pengguna baru
exports.registerUser = async (req, res) => {
  const { name, username, password, role } = req.body;

  // Validasi input
  if (!name || !username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const user = new User({ name, username, password, role: role || "user" });
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

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = generateToken(user);
    res.status(200).json({ user, token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res
      .status(500)
      .json({ message: "Error logging in user", error: error.message });
  }
};

// Update pengguna
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { name, username, password, role } = req.body;

  // Validasi input
  if (!name || !username || (password && password.length < 6)) {
    return res.status(400).json({
      message:
        "Please provide all required fields, and password must be at least 6 characters long if provided.",
    });
  }

  try {
    const updates = { name, username, role };

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

// Ambil pengguna berdasarkan ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
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
