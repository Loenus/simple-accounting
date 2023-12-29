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

require("./routes/auth.routes")(app);
require("./routes/user.routes")(app);
app.get('/', (req,res) => { // temp: for testing connection
  res.render('home')
})

const db = require("./models");
console.log("db uri: " + db.url);
db.mongoose
  .connect(db.url)
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

app.listen(process.env.NODE_DOCKER_PORT, () => {
  console.log(`Listening to port http://localhost:${process.env.NODE_LOCAL_PORT}...`);
});