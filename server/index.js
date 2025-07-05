require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const tasksRouter = require('./routes/tasks');

const app = express();
const port = process.env.PORT || 3002;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

app.use('/tasks', tasksRouter);

// Example route
app.get('/', (req, res) => {
  res.send('Life Command Server is running!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
