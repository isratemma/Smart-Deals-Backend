const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l7zck31.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Successfully connected to MongoDB!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// ==================== ROOT ====================
app.get('/', (req, res) => {
  res.send('Smart Server is running');
});

// ==================== PRODUCTS ROUTES ====================

// GET latest 6 products
app.get('/latest-products', async (req, res) => {
  try {
    const productsCollection = client.db('UsersDB').collection('products');
    const result = await productsCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// GET all products
app.get('/products', async (req, res) => {
  try {
    const productsCollection = client.db('UsersDB').collection('products');
    const result = await productsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// GET bids by product id — must be BEFORE /products/:id
app.get('/products/:productId/bids', async (req, res) => {
  try {
    const bidsCollection = client.db('UsersDB').collection('bids');
    const productId = req.params.productId;
    const result = await bidsCollection.find({ productId }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// GET single product by id
app.get('/products/:id', async (req, res) => {
  try {
    const productsCollection = client.db('UsersDB').collection('products');
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await productsCollection.findOne(query);
    if (!result) {
      return res.status(404).send({ error: 'Product not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// POST - create a new product
app.post('/products', async (req, res) => {
  try {
    const productsCollection = client.db('UsersDB').collection('products');
    const newProduct = req.body;
    newProduct.createdAt = new Date();
    const result = await productsCollection.insertOne(newProduct);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// PUT - full update a product by id
app.put('/products/:id', async (req, res) => {
  try {
    const productsCollection = client.db('UsersDB').collection('products');
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updatedProduct = { $set: req.body };
    const result = await productsCollection.updateOne(query, updatedProduct);
    if (result.matchedCount === 0) {
      return res.status(404).send({ error: 'Product not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// PATCH - partial update a product by id
app.patch('/products/:id', async (req, res) => {
  try {
    const productsCollection = client.db('UsersDB').collection('products');
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updatedFields = { $set: req.body };
    const result = await productsCollection.updateOne(query, updatedFields);
    if (result.matchedCount === 0) {
      return res.status(404).send({ error: 'Product not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// DELETE - delete a product by id
app.delete('/products/:id', async (req, res) => {
  try {
    const productsCollection = client.db('UsersDB').collection('products');
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await productsCollection.deleteOne(query);
    if (result.deletedCount === 0) {
      return res.status(404).send({ error: 'Product not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// SEED - insert sample products
app.post('/seed', async (req, res) => {
  try {
    const productsCollection = client.db('UsersDB').collection('products');
    const sampleProducts = [
      { name: 'Wireless Headphones', price: 59.99, category: 'electronics', stock: 50, createdAt: new Date() },
      { name: 'Running Shoes', price: 89.99, category: 'footwear', stock: 30, createdAt: new Date() },
      { name: 'Coffee Maker', price: 45.00, category: 'kitchen', stock: 20, createdAt: new Date() },
      { name: 'Backpack', price: 35.00, category: 'bags', stock: 40, createdAt: new Date() },
      { name: 'Sunglasses', price: 25.99, category: 'accessories', stock: 60, createdAt: new Date() },
    ];
    const result = await productsCollection.insertMany(sampleProducts);
    res.status(201).send({ message: `${result.insertedCount} products inserted`, result });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ==================== BIDS ROUTES ====================

// GET all bids
app.get('/bids', async (req, res) => {
  try {
    const bidsCollection = client.db('UsersDB').collection('bids');
    const result = await bidsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// GET bids by user email
app.get('/bids/user/:email', async (req, res) => {
  try {
    const bidsCollection = client.db('UsersDB').collection('bids');
    const email = req.params.email;
    const result = await bidsCollection.find({ email }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// POST - place a new bid
app.post('/bids', async (req, res) => {
  try {
    const bidsCollection = client.db('UsersDB').collection('bids');
    const newBid = req.body;
    newBid.createdAt = new Date();
    const result = await bidsCollection.insertOne(newBid);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// PATCH - update bid status
app.patch('/bids/:id', async (req, res) => {
  try {
    const bidsCollection = client.db('UsersDB').collection('bids');
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updatedFields = { $set: req.body };
    const result = await bidsCollection.updateOne(query, updatedFields);
    if (result.matchedCount === 0) {
      return res.status(404).send({ error: 'Bid not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// DELETE - delete a bid
app.delete('/bids/:id', async (req, res) => {
  try {
    const bidsCollection = client.db('UsersDB').collection('bids');
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await bidsCollection.deleteOne(query);
    if (result.deletedCount === 0) {
      return res.status(404).send({ error: 'Bid not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ==================== USERS ROUTES ====================

// GET all users
app.get('/users', async (req, res) => {
  try {
    const usersCollection = client.db('UsersDB').collection('users');
    const result = await usersCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// GET user by email — must be BEFORE /users/:id
app.get('/users/email/:email', async (req, res) => {
  try {
    const usersCollection = client.db('UsersDB').collection('users');
    const email = req.params.email;
    const result = await usersCollection.findOne({ email });
    if (!result) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// GET single user by id
app.get('/users/:id', async (req, res) => {
  try {
    const usersCollection = client.db('UsersDB').collection('users');
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await usersCollection.findOne(query);
    if (!result) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// POST - create a new user (only if not already exists)
app.post('/users', async (req, res) => {
  try {
    const usersCollection = client.db('UsersDB').collection('users');
    const newUser = req.body;
    const existingUser = await usersCollection.findOne({ email: newUser.email });
    if (existingUser) {
      return res.status(200).send({ message: 'User already exists', user: existingUser });
    }
    const result = await usersCollection.insertOne(newUser);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// PUT - update a user by id
app.put('/users/:id', async (req, res) => {
  try {
    const usersCollection = client.db('UsersDB').collection('users');
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updatedUser = { $set: req.body };
    const result = await usersCollection.updateOne(query, updatedUser);
    if (result.matchedCount === 0) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// DELETE - delete a user by id
app.delete('/users/:id', async (req, res) => {
  try {
    const usersCollection = client.db('UsersDB').collection('users');
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await usersCollection.deleteOne(query);
    if (result.deletedCount === 0) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Connect to DB first, then start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
});
