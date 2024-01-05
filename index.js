const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
app.get("/", (req, res) => res.send("C-uisine RUnning....................!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
// Cuisine-corner
//XeGWq4kq63zB4wZy
app.use(cors());
app.use(express.json());
const uri = process.env.MONGO_URI;
console.log(uri);
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
    const users = client.db("Cuisine-corner").collection("users");
    const menuDatabase = client.db("Cuisine-corner").collection("Menu");
    const reviesCollection = client.db("Cuisine-corner").collection("Review");
    const itemsCollection = client.db("Cuisine-corner").collection("Items");

    // middleware
    // verfiyToken
    const verfiyToken = (req, res, next) => {
      const headers = req.headers.authorization;
      if (!headers) {
        return res
          .status(401)
          .send({ error: true, message: "unauthorized access" });
      }
      const token = headers.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .send({ error: true, message: "unauthorized access" });
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .send({ error: true, message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };
    // jwt
    app.post("/jwt", async (req, res) => {
      const data = req.body;
      const token = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET);
      console.log(token);
      res.send({ token });
    });
    // user related Api
    app.post("/users", async (req, res) => {
      const data = req.body;
      const existingUser = await users.findOne({ email: req.body.email });
      if (existingUser) {
        return res.send({ message: "User already exist" });
      }
      const result = await users.insertOne(data);
      res.status(201).send(result);
    });
    app.get("/users", verfiyToken, async (req, res) => {
      // console.log(req.headers);
      const result = await users.find().toArray();

      res.send(result);
    });
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: "admin" } };
      const result = await users.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.delete("/users/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await users.deleteOne(query);
      res.send(result);
    });
    app.get("/menu", async (req, res) => {
      const data = await menuDatabase.find().toArray();
      res.send(data);
    });
    app.get("/review", async (req, res) => {
      const data = await reviesCollection.find().toArray();
      res.send(data);
    });
    // get all orders data
    app.get("/items", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await itemsCollection.find(query).toArray();
      res.status(200).send(result);
    });
    app.post("/items", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await itemsCollection.insertOne(data);
      res
        .status(201)
        .send({ message: "successfully added", result, success: true });
    });
    // delete
    app.delete("/items/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await itemsCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    console.log("yes!!!!");
  }
}
run().catch(console.dir);
