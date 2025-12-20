const express = require('express');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const router = express.Router();

// VULNERABILITY: File execution endpoint
router.post('/execute/:filename', auth, async (req, res) => {
    try {
        const { filename } = req.params;
        const { args = '' } = req.body;
        
        // VULNERABILITY: No path validation - directory traversal possible
        const filePath = path.join(__dirname, '..', 'uploads', filename);
        
        // VULNERABILITY: Execute any uploaded file
        if (fs.existsSync(filePath)) {
            // VULNERABILITY: Command injection via args
            const command = `${filePath} ${args}`;
            
            exec(command, (error, stdout, stderr) => {
                res.json({
                    success: !error,
                    command: command,
                    output: stdout,
                    error: stderr,
                    // VULNERABILITY: Expose system info
                    systemInfo: {
                        cwd: process.cwd(),
                        platform: process.platform,
                        user: process.env.USER || process.env.USERNAME
                    }
                });
            });
        } else {
            res.status(404).json({ error: 'File not found', path: filePath });
        }
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
});

// VULNERABILITY: Direct file access without authorization
router.get('/raw/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        // VULNERABILITY: No authentication required
        // VULNERABILITY: Directory traversal possible
        const filePath = path.join(__dirname, '..', 'uploads', filename);
        
        if (fs.existsSync(filePath)) {
            // VULNERABILITY: Serve any file type including executables
            res.sendFile(path.resolve(filePath));
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// VULNERABILITY: List all uploaded files
router.get('/list-all', async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        
        // VULNERABILITY: No authentication required
        const files = fs.readdirSync(uploadsDir).map(filename => {
            const filePath = path.join(uploadsDir, filename);
            const stats = fs.statSync(filePath);
            
            return {
                filename,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                // VULNERABILITY: Expose full system path
                fullPath: filePath,
                isExecutable: stats.mode & parseInt('111', 8)
            };
        });
        
        res.json({
            files,
            totalFiles: files.length,
            // VULNERABILITY: Expose server directory structure
            serverPath: uploadsDir
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;