const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database.js");
const app = express();
const TPS = require("./routes/TPS.js");
const PilgubPaslon = require("./routes/PilgubPaslon.js");
const PilkadaPaslon = require("./routes/PilkadaPaslon.js");
const PilgubSuara = require("./routes/PilgubSuara.js");
const PilkadaSuara = require("./routes/PilkadaSuara.js");
const Partai = require("./routes/Partai.js");
const User = require("./routes/User.js");
const dotenv = require("dotenv");
dotenv.config();

// connect ke database
connectDB();

// cors
app.use(
  cors({
    credentials: true,
    origin: "*",
  })
);

app.use(express.json());
app.use(TPS);
app.use(User);
app.use(Partai);
app.use(PilgubPaslon);
app.use(PilkadaPaslon);
app.use(PilgubSuara);
app.use(PilkadaSuara);

// Buat rute contoh
app.get("/", (req, res) => {
  res.send("Hello World");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
