require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.tbuverl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

    const database = client.db("MiniMinds");
    const usercollection = database.collection("users");

    //users

    // post user

    app.post("/users", async (req, res) => {
      const users = req.body;
      const result = await usercollection.insertOne(users);
      res.send(result);
    });



















    // get parcel

    app.get("/parcels", async (req, res) => {
      try {
        const { email, payment_status, delivery_status } = req.query;

        const query = {};

        if (email) {
          query.email = email;
        }
        if (payment_status) {
          query.payment_status = payment_status;
        }
        if (delivery_status) {
          query.delivery_status = delivery_status;
        }

        const parcels = await parcelcollection
          .find(query)
          .sort({ creation_date: -1 })
          .toArray();

        console.log("Parcels found:", parcels.length);
        res.send(parcels);
      } catch (error) {
        console.error("Error fetching parcels:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    //get parcel by id

    app.get("/parcels/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await parcelcollection.findOne(query);
      res.send(result);
    });

    // post parcel
    app.post("/parcels", async (req, res) => {
      const parcel = req.body;

      parcel.logs = [
        {
          status: "Created",
          timestamp: new Date(),
          note: "Parcel created by user",
        },
      ];

      const result = await parcelcollection.insertOne(parcel);
      res.send(result);
    });

    //parcel delete
    app.delete("/parcels/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await parcelcollection.deleteOne(query);

      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// pass- VkVrFgAZxtEsA5I9  simpleDbUser

app.get("/", (req, res) => {
  res.send("parcelpilot server is running100");
});

app.listen(port, () => {
  console.log(`running server in ${port} port`);
});
