var mongoose = require("mongoose");

//doc schema
var docSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("Doc", docSchema);
