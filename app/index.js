require("dotenv").config();

const express = require("express");
const app = express();

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// set views and read public folder (if present)
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const db = require("./models");
db.mongoose
  .connect(db.url)
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });


require("./routes/auth.routes")(app);
require("./routes/user.routes")(app);
require("./routes/transaction.routes")(app);


app.get("/cancella", async (req, res) => {
  req.url = '/transaction';
  req.method = 'DELETE';
  app.handle(req, res);
});
app.get('/', (req,res) => {
  res.render('home');
})
app.get('/status_server', function (req, res) {
  res.status(200).send('porta: ' + process.env.NODE_LOCAL_PORT);
});


var server = app.listen(process.env.NODE_DOCKER_PORT, () => {
  console.log(`Listening to port http://localhost:${process.env.NODE_LOCAL_PORT} ...`);
});

module.exports = server;
