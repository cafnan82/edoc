var express = require("express");
var mongoose = require("mongoose");
var path = require("path");
var bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");

var expressValidator = require("express-validator");
const { error } = require("console");
const e = require("express");
const { title } = require("process");

require("./models/doc");
var documents = require("mongoose").model("Doc");

mongoose.connect("mongodb://localhost/documents");
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("mongodb connected");
});

var app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.locals.errors = null;
app.locals.e = "";

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(expressValidator());

app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
    //cookie: { secure: true },
  })
);

//express msges middleware
app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = require("express-messages")(req, res);
  next();
});

//get index
app.get("/", (req, res) => {
  var count = 0;
  documents.count((err, c) => {
    count = c;
  });
  documents.find((err, doc) => {
    res.render("index", {
      doc: doc,
      count: count,
    });
  });
});

//get add doc
app.get("/add-doc", (req, res) => {
  var title = "";
  var content = "";

  res.render("add_doc", {
    title: title,
    content: content,
  });

  //post add doc
  app.post("/add-doc", (req, res) => {
    req.check("title", "Title must have a value").notEmpty();
    req.check("content", "Content must have a value").notEmpty();

    var title = req.body.title;
    var slug = title.replace(/\s+/g, "-").toLowerCase();
    var content = req.body.content;

    var errors = req.validationErrors();

    if (errors) {
      res.render("add_doc", {
        errors: errors,
        title: title,
        content: content,
      });
    } else {
      documents.findOne({ slug: slug }, function (err, doc) {
        if (doc) {
          var e = "Document name already exist, choose another one";
          console.log(e);
          res.render("add_doc", {
            e: e,
            title: title,
            content: content,
          });
        } else {
          var doc = new documents({
            title: title,
            content: content,
            slug: slug,
          });
          doc.save(function (err) {
            if (err) {
              return console.log(err);
            }
            req.flash("success", "Document added");
            res.redirect("/");
          });
        }
      });
    }
  });
});

//get view doc

app.get("/view-doc/:id", function (req, res) {
  documents.findById(req.params.id, function (err, doc) {
    if (err) return console.log("err");

    res.render("view_doc", {
      title: doc.title,
      content: doc.content,
      id: doc._id,
    });
  });
});

//get edit doc

app.get("/edit-doc/:id", function (req, res) {
  documents.findById(req.params.id, function (err, doc) {
    if (err) return console.log("err");

    res.render("edit_doc", {
      title: doc.title,
      slug: doc.slug,
      content: doc.content,
      id: doc._id,
    });
  });
});

//post edit doc
app.post("/edit-doc/:id", (req, res) => {
  req.check("title", "Title must have a value").notEmpty();
  req.check("content", "Content must have a value").notEmpty();

  var title = req.body.title;
  var slug = title.replace(/\s+/g, "-").toLowerCase();
  var content = req.body.content;
  var id = req.params.id;
  var errors = req.validationErrors();
  if (errors) {
    res.render("edit_doc", {
      errors: errors,
      title: title,
      content: content,
      id: id,
    });
  } else {
    documents.findById(id, function (err, doc) {
      if (err) return console.log(err);

      doc.title = title;
      doc.slug = slug;
      doc.content = content;

      doc.save(function (err) {
        if (err) {
          return console.log(err);
        }
        req.flash("success", "Document edited");
        res.redirect("/");
      });
    });
  }
});

//get delete page

app.get("/delete-doc/:id", (req, res) => {
  documents.findByIdAndRemove(req.params.id, function (err) {
    if (err) return console.log(err);
    req.flash("success", "Document deleted");
    res.redirect("/");
  });
});

// search
app.post("/search", (req, res) => {
  var title = req.body.keyword;
  documents.findOne({ title: title }, (err, doc) => {
    if (err) console.log(err);
    res.render("view_doc", {
      title: doc.title,
      content: doc.content,
      id: doc._id,
    });
  });
});

app.listen(process.env.PORT || 5000, () => {
  console.log("listening to port 5000");
});
