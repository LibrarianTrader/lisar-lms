require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/lostfound", require("./routes/lostfound"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

const routes = [
  ["auth", "./routes/auth"],
  ["catalogue", "./routes/catalogue"],
  ["patrons", "./routes/patrons"],
  ["circulation", "./routes/circulation"],
  ["acquisitions", "./routes/acquisitions"],
  ["serials", "./routes/serials"],
  ["ill", "./routes/ill"],
  ["reports", "./routes/reports"],
  ["settings", "./routes/settings"],
];

routes.forEach(([name, path]) => {
  try {
    const mod = require(path);
    const router = mod.default || mod.router || mod;
    if (typeof router === "function") {
      app.use("/api/" + name, router);
      console.log("✅ Loaded: " + name);
    } else {
      console.error("❌ Bad export in: " + name);
    }
  } catch (e) {
    console.error("❌ Failed to load " + name + ": " + e.message);
  }
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

app.listen(PORT, () => console.log("LISAR LMS API running on port " + PORT));
module.exports = app;
