let express = require('express');
let path = require('path');
let cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const { DATABASE_URL } = process.env

let app = express()
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    require: true,
  },
});

async function getPostgresVersion() {
  const client = await pool.connect();
  try {
    const response = await client.query("SELECT version()");
    console.log(response.rows[0]);
  } finally {
    client.release();
  }
}

getPostgresVersion();

app.get('/menu', async (req, res) => {
  const client = await pool.connect();

  try {
    const query = 'SELECT * FROM menu_items';
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.log(error.stack);
    res.status(500).send("An error occured.");
  } finally {
    client.release();
  }
})

app.get('/menu/:id', async (req, res) => {
  const id = req.params.id;
  const client = await pool.connect();

  try {
    const query = `SELECT * FROM menu_items WHERE id=${id}`;
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.log("Error: ", error.message);
    res.status(404).json({ error: "Item not found." });
  } finally {
    client.release();
  }
})

app.post("/menu", async (req, res) => {
  const client = await pool.connect();
  try {
    const data = {
      name: req.body.name,
      price: req.body.price,
      category: req.body.category
    };

    const query = "INSERT INTO menu_items (name, price, category) VALUES ($1, $2, $3) RETURNING id";
    const params = [data.name, data.price, data.category];

    const result = await client.query(query, params);
    data.id = result.rows[0].id; // assign the last inserted id to data object

    console.log(`Post created successfully with id ${data.id}`);
    res.json({
      status: "success",
      data: data,
      message: "Post created successfully",
    });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname + "/404.html"));
});

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});
