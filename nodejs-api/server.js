const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/status', (req, res) => {
  res.json({ service: 'nodejs-api', status: 'ok', time: Date.now() });
});

// Example placeholder route – can be expanded later
app.post('/echo', (req, res) => {
  res.json({ received: req.body });
});

app.listen(PORT, () => {
  console.log(`nodejs-api listening on port ${PORT}`);
});
