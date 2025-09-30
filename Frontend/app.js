// Import required modules
import express from 'express';  // Express.js web framework
import cors from "cors";        // Enable Cross-Origin Resource Sharing
import { dirname, join } from 'path';  // Path utilities for file/directory paths
import { fileURLToPath } from 'url';   // Convert file URL to file path

// Initialize Express application
const app = express();

// Enable CORS for all routes - allows requests from different domains
app.use(cors());

// Define server port
const port = 3001;

// Get the current directory path (needed because ES modules don't have __dirname by default)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configure middleware to serve static files from the current directory
// This allows serving CSS, JavaScript, images, and other static assets
app.use(express.static(join(__dirname)));

// Define route handler for the root path ('/')
// When users access the root URL, send them the index.html page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'pages', 'index.html'));
});

// Start the server and listen for incoming connections
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});