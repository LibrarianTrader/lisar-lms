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

app.get("/health", (req, res) => res.json({ status: "ok" }));

function loadRoute(path) {
  const mod = require(path);
  return mod.default || mod.router || mod;
}

app.use("/api/auth",         loadRoute("./routes/auth"));
app.use("/api/catalogue",    loadRoute("./routes/catalogue"));
app.use("/api/patrons",      loadRoute("./routes/patrons"));
app.use("/api/circulation",  loadRoute("./routes/circulation"));
app.use("/api/acquisitions", loadRoute("./routes/acquisitions"));
app.use("/api/serials",      loadRoute("./routes/serials"));
app.use("/api/ill",          loadRoute("./routes/ill"));
app.use("/api/reports",      loadRoute("./routes/reports"));
app.use("/api/settings",     loadRoute("./routes/settings"));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

app.listen(PORT, () => console.log(`LISAR LMS API running on port ${PORT}`));
module.exports = app;
