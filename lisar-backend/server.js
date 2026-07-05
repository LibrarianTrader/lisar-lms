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

app.use("/api/auth",         require("./routes/auth"));
app.use("/api/catalogue",    require("./routes/catalogue"));
app.use("/api/patrons",      require("./routes/patrons"));
app.use("/api/circulation",  require("./routes/circulation"));
app.use("/api/acquisitions", require("./routes/acquisitions"));
app.use("/api/serials",      require("./routes/serials"));
app.use("/api/ill",          require("./routes/ill"));
app.use("/api/reports",      require("./routes/reports"));
app.use("/api/settings",     require("./routes/settings"));

app.get("/health", (req, res) => res.json({ status: "ok", service: "LISAR LMS API" }));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

app.listen(PORT, () => console.log(`LISAR LMS API running on port ${PORT}`));
module.exports = app;
