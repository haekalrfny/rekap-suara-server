const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).send("Token is required");
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send("Invalid token");
    }
    req.user = decoded;
    next();
  });
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).send("Access denied. Admins only.");
  }
  next();
};

const checkToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new Error(null);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded;
};

module.exports = { auth, adminAuth, checkToken };
