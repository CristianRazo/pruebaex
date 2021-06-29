//inports
const express = require("express");
const app = express();
const cors = require("cors");

// Configurar cabeceras y cors
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

//Seteo
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

//importamos dotenv para las variables de entorno
const dotenv = require("dotenv");
dotenv.config({ path: "./env/.env" });

//Directorio public
app.use("/resources", express.static("public"));
app.use("/resources", express.static(__dirname + "/public"));

app.set("view engine", "ejs");

//importamos bcryptjs
const bcryptjs = require("bcryptjs");

//importamos session
const session = require("express-session");
const connection = require("./database/db");

//Estableciendo las rutas

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

require("./database/db");

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

//Register
app.post("/register", async (req, res) => {
  const user = req.body.user;
  const country = req.body.country;
  const state = req.body.state;
  const gender = req.body.gender;
  const pass = req.body.pass;
  let passwordHaash = await bcryptjs.hash(pass, 8);
  connection.query(
    "INSERT INTO users SET ?",
    {
      user: user,
      country: country,
      state: state,
      gender: gender,
      password: passwordHaash,
    },
    async (error, results) => {
      if (error) {
        console.log(error);
      } else {
        res.render("register", {
          alert: true,
          alertTitle: "Registration",
          alertMessage: "Successful Registration",
          alertIcon: "succsess",
          showConfirmButton: false,
          timer: 1500,
          ruta: "",
        });
      }
    }
  );
});

//Auth
app.post("/auth", async (req, res) => {
  console.log("control");
  const user = req.body.user;
  const pass = req.body.pass;
  let passwordHaash = await bcryptjs.hash(pass, 8);

  if (user && pass) {
    connection.query(
      "SELECT * FROM users WHERE user = ?",
      [user],
      async (error, result) => {
        if (
          result.length == 0 ||
          !(await bcryptjs.compare(pass, result[0].password))
        ) {
          res.render("login", {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Usuario o contraseña incorrecta",
            alertIcon: "error",
            showConfirmButton: true,
            timer: false,
            ruta: "login",
          });
        } else {
          req.session.loggedin = true;
          req.session.user = result[0].user;
          res.render("login", {
            alert: true,
            alertTitle: "Conexion exitosa",
            alertMessage: "Login correcto",
            alertIcon: "success",
            showConfirmButton: false,
            timer: 1500,
            ruta: "",
          });
        }
      }
    );
  }
});

//auth pages
app.get("/", (req, res) => {
  if (req.session.loggedin) {
    res.render("index", {
      login: true,
      name: req.session.user,
    });
  } else {
    res.render("index", {
      login: false,
      name: "Debe Iniciar sesion",
    });
  }
});

//Logout

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.get("/record", (req, res) => {
  if (req.session.loggedin) {
    res.render("record");
  } else {
    res.redirect("/");
  }
});

app.listen(3000, (req, res) => {
  console.log("Server Running in http://localhost:3000");
});

//Mostrar todos los artículos
app.get("/api/users", (req, res) => {
  connection.query(
    "SELECT id,user,country,state,gender  FROM users",
    (error, filas) => {
      if (error) {
        throw error;
      } else {
        res.send(filas);
      }
    }
  );
});
