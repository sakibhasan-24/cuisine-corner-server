const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
app.get("/", (req, res) => res.send("C-uisine RUnning....................!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
// Cuisine-corner
//XeGWq4kq63zB4wZy

const uri = process.env.MONGO_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    console.log("connected");
  } finally {
    console.log("yes!!!!");
  }
}
run().catch(console.dir);
