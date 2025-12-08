const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// In-memory storage for demo
let drawings = {};

// Save drawing
app.post('/api/drawings/:id', (req, res) => {
  const { id } = req.params;
  const { shapes } = req.body;
  drawings[id] = shapes;
  console.log(`Saved drawing ${id} with ${shapes.length} shapes`);
  res.json({ success: true });
});

// Load drawing
app.get('/api/drawings/:id', (req, res) => {
  const { id } = req.params;
  const shapes = drawings[id] || [];
  res.json({ shapes });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

