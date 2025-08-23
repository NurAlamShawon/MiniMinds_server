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


//for access token

var admin = require("firebase-admin");

const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString(
  "utf8"
);
var serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


// // middleware for verify token

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decode = await admin.auth().verifyIdToken(token);
    req.decoded = decode;
    next();
  } catch (err) {
    return res.status(401).send({ message: "unauthorized" });
  }
};


 //middleware for verify admin

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      console.log("Decoded Email:", req.decoded.email);
      const query = { email };
      const user = await userscollection.findOne(query);
      if (!user || user.role !== "admin") {
        return res.status(403).send({ message: "forbidden" });
      }

      next();
    };


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
    const reviewcollection = database.collection("reviews");
    const lessoncollection = database.collection("lesson");
    const quizResultsCollection = database.collection("quiz");
    const redemcollection=database.collection("redems");

    //users

    // post user

    app.post("/users",  async (req, res) => {
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
    app.get("/users/search", verifyFirebaseToken,verifyAdmin, async (req, res) => {
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
    app.put("/users/:id/make-admin",verifyFirebaseToken,verifyAdmin, async (req, res) => {
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

    // add gems
    app.patch("/users/gems/:email", verifyFirebaseToken, async (req, res) => {
      const email = req.params.email;
      const { gems } = req.body;

      try {
        const result = await usercollection.updateOne(
          { email: email },
          { $inc: { gems: gems } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        res.send({ success: true, email, gems });
      } catch (error) {
        console.error("Error updating gems:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // make admin to user
    app.put("/users/:id/remove-admin", verifyFirebaseToken,verifyAdmin, async (req, res) => {
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

      // patch user for avater img add
    app.patch("/avater/:email",  async (req, res) => {
      const email = req.params.email;
      const { img } = req.body;
      const result = await usercollection.updateOne(
        { email },
        { $set: { img: img } }
      );
      res.send(result);
    });

    //post avater
    app.post("/avaters",  async (req, res) => {
      const avater = req.body;
      const result = await avatercollection.insertOne(avater);
      res.status(201).send(result);
    });

    //review part

    //get review
    app.get("/review", async (req, res) => {
      try {
        const avaters = await reviewcollection.find({}).toArray();

        res.send(avaters);
      } catch (error) {
        console.error("Error fetching parcels:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    //post review
    app.post("/review", async (req, res) => {
      const avater = req.body;
      const result = await reviewcollection.insertOne(avater);
      res.status(201).send(result);
    });

    //lesson part

    // GET all lessons
    app.get("/lessons", async (req, res) => {
      try {
        const lessons = await lessoncollection.find({}).toArray();
        res.send(lessons);
      } catch (error) {
        console.error("Error fetching lessons:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // POST new lesson
    app.post("/lessons",verifyFirebaseToken,verifyAdmin,  async (req, res) => {
      try {
        const lesson = req.body;
        const result = await lessoncollection.insertOne(lesson);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error saving lesson:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    //quiz part

    //post quiz
    app.post("/quiz-results",verifyFirebaseToken,  async (req, res) => {
      const { userId, quizId, score, total } = req.body;

      if (!userId || !quizId || score === undefined || total === undefined) {
        return res.status(400).send({ message: "Missing fields" });
      }

      try {
        // 1️⃣ Check if this user already has a result for this quiz
        const existingResult = await quizResultsCollection.findOne({
          userId,
          quizId: new ObjectId(String(quizId)),
        });

        if (existingResult) {
          return res
            .status(403)
            .send({ message: "You have already taken this quiz." });
        }

        // 2️⃣ Save new result
        await quizResultsCollection.insertOne({
          userId,
          quizId: new ObjectId(String(quizId)),
          score,
          total,
          timestamp: new Date(),
        });

        res.status(200).send({ message: "Result saved" });
      } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Failed to save quiz result" });
      }
    });

    // Get quiz attempt info
    app.get("/quiz-results/:userId/:quizId",verifyFirebaseToken,  async (req, res) => {
      const { userId, quizId } = req.params;

      try {
        const result = await quizResultsCollection.findOne({
          userId: userId, // string in DB
          quizId: new ObjectId(quizId), // convert to ObjectId
        });

        res.send({ attempted: !!result, result });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // Get standings for a specific lesson/quiz

    app.get("/standings/:quizId",verifyFirebaseToken,  async (req, res) => {
      const { quizId } = req.params;

      try {
        const results = await quizResultsCollection
          .aggregate([
            { $match: { quizId: new ObjectId(quizId) } },
            {
              $lookup: {
                from: "users",
                let: { userIdStr: "$userId" },
                pipeline: [
                  { $addFields: { _idStr: { $toString: "$_id" } } },
                  { $match: { $expr: { $eq: ["$_idStr", "$$userIdStr"] } } },
                ],
                as: "userInfo",
              },
            },
            { $unwind: "$userInfo" },
            { $sort: { score: -1, timestamp: 1 } },
          ])
          .toArray();

        res.send(results);
      } catch (error) {
        console.error("Error fetching standings:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

//redem
// Create a redemption (called from your GiftRedeem component)
app.post("/redemptions", async (req, res) => {
  try {
    const { email, giftId, giftName, giftImg, cost = 0, address = {} } = req.body;

    if (!email || !giftId || !giftName) {
      return res.status(400).json({ error: "email, giftId, giftName are required" });
    }

    // minimal address validation
    const required = ["name", "phone", "address1", "city", "postalCode"];
    for (const k of required) {
      if (!address[k]) return res.status(400).json({ error: `address.${k} is required` });
    }

    const now = new Date();
    const doc = {
      email,
      giftId,
      giftName,
      giftImg: giftImg || "",
      cost: Number(cost) || 0,
      address: {
        name: address.name,
        phone: address.phone,
        address1: address.address1,
        address2: address.address2 || "",
        city: address.city,
        postalCode: address.postalCode,
        notes: address.notes || "",
      },
      deliveryStatus: false, // default false (not delivered yet)
      createdAt: now,
      updatedAt: now,
    };

    const result = await redemcollection.insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (err) {
    console.error("Create redemption error:", err);
    res.status(500).json({ error: err.message });
  }
});

// List redemptions (admin or filter by email)
app.get("/redemptions", async (req, res) => {
  try {
    const { email } = req.query;
    const query = email ? { email } : {};
    const items = await redemcollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    res.json(items);
  } catch (err) {
    console.error("Get redemptions error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get a single redemption (optional)
app.get("/redemptions/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const item = await redemcollection.findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    console.error("Get redemption error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: update delivery status (true/false)
app.patch("/redemptions/:id/delivery", async (req, res) => {
  try {
    const id = req.params.id;
    const { deliveryStatus } = req.body; // expect boolean
    const result = await redemcollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { deliveryStatus: !!deliveryStatus, updatedAt: new Date() } }
    );
    res.json(result);
  } catch (err) {
    console.error("Update delivery status error:", err);
    res.status(500).json({ error: err.message });
  }
});









  
    //all data about this database
    app.get("/admin/overview", async (req, res) => {
      try {
        const result = await parcelcollection
          .aggregate([
            {
              $facet: {
                totalParcels: [{ $count: "count" }],
                completedDeliveries: [
                  { $match: { delivery_status: "Delivered" } },
                  { $count: "count" },
                ],
              },
            },
            {
              $addFields: {
                totalParcels: { $arrayElemAt: ["$totalParcels.count", 0] },
                completedDeliveries: {
                  $arrayElemAt: ["$completedDeliveries.count", 0],
                },
              },
            },
          ])
          .toArray();

        const parcelStats = result[0];

        const [totalUsers, totalAdmins] = await Promise.all([
          usercollection.countDocuments({ role: "user" }),
          usercollection.countDocuments({ role: "admin" }),
        ]);

        res.json({
          totalParcels: parcelStats.totalParcels || 0,
          completedDeliveries: parcelStats.completedDeliveries || 0,
          totalUsers,
          totalAdmins,
        });
      } catch (error) {
        console.error("Aggregation error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
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
