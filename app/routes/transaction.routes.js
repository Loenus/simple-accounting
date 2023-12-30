module.exports = app => {
  const transactions = require("../controllers/transaction.controller.js");
  var router = require("express").Router();

  router.post("/upload", transactions.upload)
  router.get("/download", transactions.download);
  router.get("/", transactions.findAll);
  router.delete("/", transactions.deleteAll);

  app.use("/transaction", router);
};