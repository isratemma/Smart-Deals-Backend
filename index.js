const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB setup //
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l7zck31.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await client.connect();
    isConnected = true;
    console.log('Successfully connected to MongoDB!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// Middleware
app.use(
  cors({
    origin: ['https://bucolic-baklava-2721b6.netlify.app/'],
    credentials: true,
  })
);
app.use(express.json());

// Ensure MongoDB connected on every request (serverless safe)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

const jwtSecret = process.env.JWT_SECRET || 'smartdeals_super_secret_key_2025';
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Unauthorized - no token' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) return res.status(403).send({ error: 'Forbidden - invalid token' });
    req.user = decoded;
    req.tokenEmail = decoded.email;
    next();
  });
};

// ==================== ROOT ====================
app.get('/', (req, res) => {
  res.send('Smart Server is running');
});

app.post('/jwt', (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, jwtSecret, { expiresIn: '7d' });
  res.send({ token });
});

// ==================== PRODUCTS ====================

app.get('/latest-products', async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('products')
      .find().sort({ createdAt: -1 }).limit(6).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/products', async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('products').find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/products/:productId/bids', async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('bids')
      .find({ productId: req.params.productId }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('products')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!result) return res.status(404).send({ error: 'Product not found' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post('/products', verifyToken, async (req, res) => {
  try {
    const newProduct = { ...req.body, createdAt: new Date() };
    const result = await client.db('UsersDB').collection('products').insertOne(newProduct);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.put('/products/:id', verifyToken, async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('products')
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
    if (result.matchedCount === 0) return res.status(404).send({ error: 'Product not found' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.patch('/products/:id', verifyToken, async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('products')
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
    if (result.matchedCount === 0) return res.status(404).send({ error: 'Product not found' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.delete('/products/:id', verifyToken, async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('products')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).send({ error: 'Product not found' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ==================== BIDS ====================

app.get('/bids', verifyToken, async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('bids').find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/bids/user/:email', verifyToken, async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('bids')
      .find({ email: req.params.email }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post('/bids', verifyToken, async (req, res) => {
  try {
    const newBid = { ...req.body, createdAt: new Date() };
    const result = await client.db('UsersDB').collection('bids').insertOne(newBid);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.patch('/bids/:id', verifyToken, async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('bids')
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
    if (result.matchedCount === 0) return res.status(404).send({ error: 'Bid not found' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.delete('/bids/:id', verifyToken, async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('bids')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).send({ error: 'Bid not found' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ==================== USERS ====================

app.get('/users', verifyToken, async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('users').find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/users/email/:email', async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('users')
      .findOne({ email: req.params.email });
    if (!result) return res.status(404).send({ error: 'User not found' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/users/:id', verifyToken, async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('users')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!result) return res.status(404).send({ error: 'User not found' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    const newUser = req.body;
    const existingUser = await client.db('UsersDB').collection('users')
      .findOne({ email: newUser.email });
    if (existingUser) {
      return res.status(200).send({ message: 'User already exists', user: existingUser });
    }
    const result = await client.db('UsersDB').collection('users').insertOne(newUser);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.put('/users/:id', verifyToken, async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('users')
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });
    if (result.matchedCount === 0) return res.status(404).send({ error: 'User not found' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.delete('/users/:id', verifyToken, async (req, res) => {
  try {
    const result = await client.db('UsersDB').collection('users')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).send({ error: 'User not found' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

module.exports = app;
