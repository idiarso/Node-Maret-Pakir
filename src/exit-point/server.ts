import express from 'express';
import { createServer } from 'http';
import path from 'path';

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 