require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

const stripe = require("stripe")(process.env.SECRET_KEY);
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
console.log(process.env.SECRET_KEY);
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    const users = client.db("Cuisine-corner").collection("users");
    const menuDatabase = client.db("Cuisine-corner").collection("Menu");
    const reviesCollection = client.db("Cuisine-corner").collection("Review");
    const itemsCollection = client.db("Cuisine-corner").collection("Items");
    const paymentCollection = client.db("Cuisine-corner").collection("Payment");

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
    // verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const adminEmail = req.decoded.email;
      const query = { email: adminEmail };
      const user = await users.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res
          .status(403)
          .send({ error: true, message: "unauthorized access" });
      }
      next();
    };
    // jwt
    app.post("/jwt", async (req, res) => {
      const data = req.body;
      const token = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET);
      // console.log(token);
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
    app.get("/users", verfiyToken, verifyAdmin, async (req, res) => {
      // console.log(req.headers);
      const result = await users.find().toArray();

      res.send(result);
    });
    // meke admin role related api

    app.patch(
      "/users/admin/:id",
      verfiyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { role: "admin" } };
        const result = await users.updateOne(filter, updateDoc);
        res.send(result);
      }
    );
    // check admin or not
    app.get("/users/admin/:email", verfiyToken, async (req, res) => {
      const email = req.params.email;
      // console.log("decode", req.decoded);
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await users.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin" ? true : false;
      }
      res.send({ admin: admin });
    });
    // check admin or not

    app.delete("/users/:id", verfiyToken, verifyAdmin, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await users.deleteOne(query);
      res.send(result);
    });
    // menu related API
    app.get("/menu", async (req, res) => {
      const data = await menuDatabase.find().toArray();
      res.send(data);
    });
    app.get("/menu/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuDatabase.findOne(query);

      res.send(result);
    });
    app.post("/menu", verfiyToken, verifyAdmin, async (req, res) => {
      const item = req.body;
      const result = await menuDatabase.insertOne(item);
      res.send(result);
    });
    app.delete("/menu/:id", verfiyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuDatabase.deleteOne(query);
      console.log(result);
      res.send(result);
    });
    app.patch("/menu/:id", async (req, res) => {
      const id = req.params.id;
      const item = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: item.name,
          recipe: item.recipe,
          image: item.image,
          price: item.price,
          category: item.category,
        },
      };
      const result = await menuDatabase.updateOne(filter, updateDoc);
      console.log(result);
      res.send(result);
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
      // console.log(data);
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

    // payment functionality
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;

      const amount = parseInt(price * 100);
      console.log(amount);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    // payment create for menu
    app.post("/payment", async (req, res) => {
      const data = req.body;
      const paymentResult = await paymentCollection.insertOne(data);
      const query = {
        _id: {
          $in: data.cartId.map((id) => new ObjectId(id)),
        },
      };
      const deleteResult = await itemsCollection.deleteMany(query);
      console.log(deleteResult);
      console.log(query);
      res.send({ paymentResult, deleteResult });
    });
    app.get("/payment/:email", verfiyToken, async (req, res) => {
      const query = { email: req.params.email };
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });
    // state(user,order,revinew) for admin
    app.get("/state/admin", async (req, res) => {
      const user = await users.estimatedDocumentCount();
      const menuItems = await menuDatabase.estimatedDocumentCount();
      // const menu = await itemsCollection.estimatedDocumentCount();
      // const payments = await paymentCollection.find().toArray();
      const orders = await paymentCollection.estimatedDocumentCount();
      // const price = payments.reduce((acc, curr) => acc + curr.price, 0);
      const result = await paymentCollection
        .aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$price" },
            },
          },
        ])
        .toArray();
      // console.log(result[0]);
      const price = result.length > 0 ? result[0].totalRevenue : 0;
      res.send({ user, menuItems, orders, price });
    });
    // order state
    app.get(
      "/admin-order-state",

      async (req, res) => {
        const result = await paymentCollection
          .aggregate([
            {
              $unwind: "$menuItemsId",
            },
            {
              $lookup: {
                from: "Menu",
                localField: "menuItemsId",
                foreignField: "_id",
                as: "menuItems",
              },
            },
            {
              $unwind: "$menuItems",
            },
            {
              $group: {
                _id: "$menuItems.category",
                quantity: {
                  $sum: 1,
                },
                totalRevenue: {
                  $sum: "$menuItems.price",
                },
              },
            },
            {
              $project: {
                _id: 0,
                category: "$_id",
                quantity: "$quantity",
                totalRevenue: "$totalRevenue",
              },
            },
          ])
          .toArray();
        // console.log(result);
        res.send(result);
      }
    );
  } finally {
    console.log("yes!!!!");
  }
}
run().catch(console.dir);
