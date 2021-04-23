const express = require("express");
const bodyParser = require("body-parser");
const pino = require("express-pino-logger")();
const axios = require("axios");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);

const POE_API = "https://pathofexile.com";

const stripPath = path => path.replace("/api", "");

app.get("/api/*", (req, res) => {
  axios
    .get(`${POE_API}${stripPath(req.path)}`, {
      headers: {
        Cookie: req.headers["poe-cookie"]
      },
      params: req.query || {}
    })
    .then(result => {
      res.json(result.data);
    })
    .catch(err => {
      res.send(err);
    });
});

app.listen(3001, () =>
  console.log("Express server is running on localhost:3001")
);
