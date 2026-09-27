import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4200;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend from the client build directory
app.use(express.static(path.join(__dirname, '..', '..', '..', 'dist', 'client')));

// API routes for AI services
app.get('/api/ai/routes', (req, res) => {
  res.json({
    success: true,
    data: {
      providers: ['codex', 'direct', 'manual'],
      endpoints: {
        analyze: '/api/ai/analyze',
        brief: '/api/brief'
      }
    }
  });
});

// Mock AI analysis endpoint
app.post('/api/ai/analyze', (req, res) => {
  // Simulate processing delay
  setTimeout(() => {
    // Mock response based on whether URL or file was provided
    if (req.body.url) {
      res.json({
        success: true,
        data: {
          sourceId: 'src-' + Math.random().toString(36).substr(2, 9),
          title: 'Analyzed Video from URL',
          duration: 120,
          videoPath: '/mock/path/video.mp4',
          // Additional metadata that the frontend might expect
          subtitles: [
            { start: 0, end: 5, text: 'Welcome to this amazing video!' },
            { start: 5, end: 10, text: 'Today we will learn about AI-powered video editing.' }
          ]
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          sourceId: 'src-' + Math.random().toString(36).substr(2, 9),
          title: 'Uploaded Video File',
          duration: 90,
          videoPath: '/mock/path/uploaded.mp4',
          subtitles: [
            { start: 0, end: 4, text: 'This is an uploaded video.' },
            { start: 4, end: 8, text: 'Processing complete.' }
          ]
        }
      });
    }
  }, 1000); // 1 second delay to simulate processing
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all API fallback
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Fallback to index.html for any non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return;
  res.sendFile(path.join(__dirname, '..', '..', '..', 'dist', 'client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Reframe Engine backend running on http://localhost:${PORT}`);
  console.log(`AI Provider routes available at /api/ai/routes`);
});