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
    const avatercollection = database.collection("avaters");

    //users

    // post user

    app.post("/users", async (req, res) => {
      console.log("data posted", req.body);
      const newUser = req.body;

      // Check if a user with the same email already exists
      const existingUser = await usercollection.findOne({
        email: newUser.email,
      });

      if (existingUser) {
        // If user exists, don't create a new one or update role
        return res.status(200).json({ message: "User already exists." });
      }

      // If not exists, insert new user
      const result = await usercollection.insertOne(newUser);
      res.status(201).json(result);
    });

    //get user
    app.get("/users", async (req, res) => {
      try {
        const { email } = req.query;

        const query = {};

        if (email) {
          query.email = email;
        }

        const user = await usercollection
          .find(query)
          .sort({ creation_date: -1 })
          .toArray();

        res.send(user);
      } catch (error) {
        console.error("Error fetching parcels:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    //  GET user
    app.get("/users/search", async (req, res) => {
      const emailQuery = req.query.email;
      console.log(emailQuery);
      const regex = new RegExp(emailQuery, "i");

      try {
        const users = await usercollection
          .find({ email: { $regex: regex } })
          .limit(10)
          .toArray();
        res.send(users);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: err.message });
      }
    });

    //make user to admin
    app.put("/users/:id/make-admin", async (req, res) => {
      const userId = req.params.id;

      try {
        const result = await usercollection.updateOne(
          { _id: new ObjectId(String(userId)) },
          {
            $set: {
              role: "admin",
            },
          }
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // make admin to user
    app.put("/users/:id/remove-admin", async (req, res) => {
      const userId = req.params.id;

      try {
        const result = await usercollection.updateOne(
          { _id: new ObjectId(String(userId)) },
          {
            $set: {
              role: "user",
            },
          }
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // patch user for avater img add
    app.patch("/users/:email", async (req, res) => {
      const email = req.params.email;
      const { img } = req.body;
      const result = await usercollection.updateOne(
        { email },
        { $set: { img: img } }
      );
      res.send(result);
    });

    //avater part

    //get avater

    app.get("/avaters", async (req, res) => {
      try {
        const avaters = await avatercollection.find({}).toArray();

        res.send(avaters);
      } catch (error) {
        console.error("Error fetching parcels:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    //post avater
    app.post("/avaters", async (req, res) => {
      const avater = req.body;
      const result = await avatercollection.insertOne(avater);
      res.status(201).send(result);
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
