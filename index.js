const path = require("path");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const express = require("express");
const db = require("./database");
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");

let cid = 0,
  sid = 0;

const app = express();

// To parse incoming JSON in POST request body:
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser("secret"));
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  const valid = req.flash("msg");
  res.render("./home/home", { valid });
});

app.post("/login", (req, res) => {
  let { email, password, type } = req.body;
  if (type == "customer") {
    db.query(
      `select cid from customer where email_id="${email}" and password="${password}"`,
      (err, rows, fields) => {
        if (rows.length != 0) {
          cid = rows[0].cid;
          res.redirect("/customer");
        } else {
          req.flash("msg", "Email id or Password is wrong");
          res.redirect("/");
        }
      }
    );
  } else {
    db.query(
      `select srid from showroom where email_id='${email}' and password='${password}'`,
      (err, rows, fields) => {
        if (rows.length != 0) {
          sid = rows[0].srid;
          res.redirect("/showroom");
        } else {
          req.flash("msg", "Email id or Password is wrong");
          res.redirect("/");
        }
      }
    );
  }
});

app.get("/showroom", (req, res) => {
  if (sid != 0) {
    db.query(
      `select t.ride_date,t.time_slot,t.model,sname,cname,tid
    from test_ride t,salesman s,customer c
    where t.cid=c.cid and t.sid=s.sid ;`,
      (err, rows, fields) => {
        res.render("./showroom/dashboard", { rows: rows });
      }
    );
  } else res.redirect("/");
});

app.get("/showroom/staff", (req, res) => {
  if (sid != 0) {
    db.query(
      `select sname,phone,salary,addr,sid from salesman;`,
      (err, rows, fields) => {
        res.render("./showroom/staff", { rows: rows });
      }
    );
  } else res.redirect("/");
});

app.get("/showroom/staff/new", (req, res) => {
  if (sid != 0) res.render("./showroom/addSalesman");
  else res.redirect("/");
});

app.post("/showroom/staff/new", (req, res) => {
  if (sid != 0) {
    let { sname, phone, salary, addr } = req.body;
    db.query(
      `INSERT INTO salesman (sname, phone, salary,addr)
      VALUES ('${sname}',${phone},${salary},'${addr}');`,
      (err, rows, fields) => {
        res.redirect("/showroom/staff");
      }
    );
  } else res.redirect("/");
});

app.get("/showroom/profile", (req, res) => {
  if (sid != 0) {
    db.query(
      `select sr_name,phone,email_id,addr
    from showroom where srid=${sid};`,
      (err, rows, fields) => {
        res.render("./showroom/myProfile", { rows: rows });
      }
    );
  } else res.redirect("/");
});

app.get("/showroom/cars", (req, res) => {
  if (sid != 0) {
    db.query(
      `select model,price,release_year,car_id from car;`,
      (err, rows, fields) => {
        res.render("./showroom/cars", { rows: rows });
      }
    );
  } else res.redirect("/");
});

app.get("/showroom/cars/new", (req, res) => {
  if (sid != 0) res.render("./showroom/addCar");
  else res.redirect("/");
});

app.post("/showroom/cars/new", (req, res) => {
  if (sid != 0) {
    let { model, release_year, price } = req.body;
    db.query(
      `INSERT INTO car (model, release_year, price)
      VALUES ('${model}',${release_year},${price});`,
      (err, rows, fields) => {
        res.redirect("/showroom/cars");
      }
    );
  } else res.redirect("/");
});

app.get("/showroom/cars/update/:id", (req, res) => {
  if (sid != 0) {
    let id = req.params.id;
    db.query(
      `select model,price,release_year,car_id from car where car_id=${id};`,
      (err, rows, fields) => {
        res.render("./showroom/updateCar", { rows: rows });
      }
    );
  } else res.redirect("/");
});

app.post("/showroom/cars/update/:id", (req, res) => {
  if (sid != 0) {
    let id = req.params.id;
    let { model, release_year, price } = req.body;
    db.query(
      `UPDATE car
      SET model = '${model}', release_year = ${release_year}, price=${price}
      WHERE car_id=${id};`,
      (err, rows, fields) => {
        res.redirect("/showroom/cars");
      }
    );
  } else res.redirect("/");
});

app.get("/showroom/staff/update/:id", (req, res) => {
  if (sid != 0) {
    let id = req.params.id;
    db.query(
      `select sname,phone,salary,addr,sid from salesman where sid=${id};`,
      (err, rows, fields) => {
        res.render("./showroom/updateSalesman", { rows: rows });
      }
    );
  } else res.redirect("/");
});

app.post("/showroom/staff/update/:id", (req, res) => {
  if (sid != 0) {
    let id = req.params.id;
    let { sname, phone, salary, addr } = req.body;
    db.query(
      `UPDATE salesman
      SET sname = '${sname}', phone = ${phone}, salary=${salary}, addr='${addr}'
      WHERE sid=${id};`,
      (err, rows, fields) => {
        res.redirect("/showroom/staff");
      }
    );
  } else res.redirect("/");
});

app.get("/showroom/:tid", (req, res) => {
  if (sid != 0) {
    let tid = parseInt(req.params.tid);
    db.query(
      `delete from test_ride where tid='${tid}';`,
      (err, rows, fields) => {
        res.redirect("/showroom");
      }
    );
  } else res.redirect("/");
});

app.get("/showroom/cars/:id", (req, res) => {
  if (sid != 0) {
    let id = req.params.id;
    db.query(`delete from car where car_id="${id}";`, (err, rows, fields) => {
      res.redirect("/showroom/cars");
    });
  } else res.redirect("/");
});

app.get("/showroom/staff/:id", (req, res) => {
  if (sid != 0) {
    let id = parseInt(req.params.id);
    db.query(`delete from salesman where sid=${id};`, (err, rows, fields) => {
      res.redirect("/showroom/staff");
    });
  } else res.redirect("/");
});

app.get("/customer", (req, res) => {
  if (cid != 0) {
    db.query(
      `select model,price,release_year,car_id from car;`,
      (err, rows, fields) => {
        res.render("./customer/dashboard", { rows: rows });
      }
    );
  } else res.redirect("/");
});

app.get("/customer/rides", (req, res) => {
  if (cid != 0) {
    db.query(
      `select t.ride_date,t.time_slot,t.model,sname,t.tid
    from test_ride t,salesman s,customer c
    where t.cid=c.cid and t.sid=s.sid and c.cid=${cid};`,
      (err, rows, fields) => {
        res.render("./customer/rides", { rows: rows });
      }
    );
  } else res.redirect("/");
});

app.post("/customer/search", (req, res) => {
  if (cid != 0) {
    let { model } = req.body;
    db.query(
      `select model,price,release_year from car where model='${model}';`,
      (err, rows, fields) => {
        if (rows.length != 0) {
          res.render("./customer/search", { rows: rows });
        } else res.render("./customer/notfound");
      }
    );
  } else res.redirect("/");
});

app.get("/customer/profile", (req, res) => {
  if (cid != 0) {
    db.query(
      `select cname,phone,email_id,gender,addr
    from customer where cid=${cid};`,
      (err, rows, fields) => {
        res.render("./customer/myProfile", { rows: rows });
      }
    );
  } else res.redirect("/");
});

app.get("/customer/rides", (req, res) => {
  if (cid != 0) {
    db.query(
      `select t.ride_date,t.time_slot,t.model,sname,t.tid
    from test_ride t,salesman s,customer c
    where t.cid=c.cid and t.sid=s.sid and c.cid=${cid};`,
      (err, rows, fields) => {
        res.render("./customer/rides", { rows: rows });
      }
    );
  } else res.redirect("/");
});

app.get("/customer/:id", (req, res) => {
  if (cid != 0) {
    let id = req.params.id;
    db.query(
      `select model,cname from car, customer where car_id='${id}' and cid=${cid};`,
      (err, rows, fields) => {
        res.render("./customer/newRide", { rows: rows, car_id: id });
      }
    );
  } else res.redirect("/");
});

app.post("/customer/:id", (req, res) => {
  if (cid != 0) {
    let id = req.params.id;
    let { model, cname, ride_date, time_slot } = req.body;
    db.query(`select sid from salesman;`, (err, rsid, fields) => {
      function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
      }
      let i = getRandom(0, rsid.length);
      db.query(
        `INSERT INTO test_ride (ride_date, time_slot, cid,sid,model)
        VALUES ('${ride_date}','${time_slot}',${cid},${rsid[i].sid},'${model}');`,
        (err, rows, fields) => {
          res.redirect("/customer/rides");
        }
      );
    });
  } else res.redirect("/");
});

app.get("/customer/rides/:tid", (req, res) => {
  if (cid != 0) {
    let tid = parseInt(req.params.tid);
    db.query(`delete from test_ride where tid=${tid};`, (err, rows, fields) => {
      res.redirect("/customer/rides");
    });
  } else res.redirect("/");
});

app.get("/about", (req, res) => {
  if (cid != 0) {
    db.query(
      `select addr,email_id,phone from showroom;`,
      (err, rows, fields) => {
        let msg = req.flash("msg");
        res.render("./customer/about", { rows: rows, msg });
      }
    );
  } else res.redirect("/");
});

app.post("/about", (req, res) => {
  req.flash(
    "msg",
    `Thank you ${req.body.name} for providing your contact details,we will contact you soon`
  );
  res.redirect("/about");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  let { name, email, phone, password } = req.body;
  db.query(
    `INSERT INTO customer (cname, phone, email_id, password)
    VALUES ('${name}',${phone},'${email}','${password}');`,
    (err, rows, fields) => {
      res.redirect("/");
    }
  );
});

app.post("/logout", (req, res) => {
  (sid = 0), (cid = 0);
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("ON PORT 3000!");
});
