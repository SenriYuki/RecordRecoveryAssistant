const path = require('path');
const fs = require('fs');

/**
 * Plugin Information / 插件信息
 */
const info = {
    id: 'record-recovery-assistant',
    name: 'Record Recovery Assistant',
    description: 'Backend file recovery tool with character detection / 支持角色名称检测的后端文件恢复工具',
};

// Path Definitions / 路径定义
const PLUGIN_DIR = __dirname;
const EXTENSION_DIR = path.join(process.cwd(), 'public', 'scripts', 'extensions', 'third-party', 'RecordRecoveryAssistant');
const BACKUP_DIR = path.join(process.cwd(), 'data', 'default-user', 'backups');
const CHAT_DIR = path.join(process.cwd(), 'data', 'default-user', 'chats');

/**
 * Deploy frontend files to ST extension directory automatically.
 * 自动将前端文件部署到 SillyTavern 的扩展目录。
 */
function installFrontend() {
    try {
        if (!fs.existsSync(EXTENSION_DIR)) fs.mkdirSync(EXTENSION_DIR, { recursive: true });
        ['index.js', 'style.css', 'manifest.json'].forEach(file => {
            const src = path.join(PLUGIN_DIR, 'public', file);
            const dest = path.join(EXTENSION_DIR, file);
            if (fs.existsSync(src)) fs.copyFileSync(src, dest);
        });
        console.log('[RecordRecovery] UI Extension installed/updated.');
    } catch (err) {
        console.error('[RecordRecovery] Failed to install UI:', err);
    }
}

/**
 * Detect character name from file content (Last 100KB).
 * 从文件内容检测角色名称（读取最后 100KB）。
 * [Modified] Increased scan size to 100KB for consistency.
 */
function detectCharacterName(filePath) {
    try {
        const stat = fs.statSync(filePath);
        // Unified to 100KB scanning
        const readSize = Math.min(stat.size, 102400); 
        const buffer = Buffer.alloc(readSize);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, readSize, stat.size - readSize);
        fs.closeSync(fd);
        
        const content = buffer.toString('utf-8');
        const lines = content.trim().split('\n');
        
        // Scan backwards / 倒序扫描
        for (let i = lines.length - 1; i >= 0; i--) {
            try {
                const json = JSON.parse(lines[i]);
                
                // Priority 1: Check 'character_name' / 检查 character_name 字段
                if (json.character_name) return json.character_name;

                // Priority 2: Check non-user messages / 检查非用户发言
                let isUser = json.is_user;
                if (json.data && json.data.is_user !== undefined) isUser = json.data.is_user;

                if (isUser === false) {
                    let name = json.name || (json.data && json.data.name);
                    if (name && name !== 'System') return name;
                }
            } catch (e) {}
        }
    } catch (err) {
        return null;
    }
    return null;
}

function init(app, config) {
    console.log('[RecordRecovery] Plugin Initializing...');
    installFrontend();

    // API: List backups with metadata / 获取备份列表及元数据
    app.post('/list', (req, res) => {
        if (!fs.existsSync(BACKUP_DIR)) return res.json({ success: true, files: [] });
        try {
            const files = fs.readdirSync(BACKUP_DIR)
                .filter(f => f.endsWith('.jsonl'))
                .map(file => {
                    const filePath = path.join(BACKUP_DIR, file);
                    const stat = fs.statSync(filePath);
                    const detectedChar = detectCharacterName(filePath);

                    return { 
                        name: file, 
                        mtime: stat.mtime, 
                        size: stat.size,
                        charName: detectedChar
                    };
                })
                .sort((a, b) => b.mtime - a.mtime);
            res.json({ success: true, files });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Smart Preview (Last 100KB) / 智能预览（最后 100KB）
    app.post('/preview', (req, res) => {
        try {
            const filePath = path.join(BACKUP_DIR, path.basename(req.body.filename));
            if (!fs.existsSync(filePath)) throw new Error('File not found');
            const stat = fs.statSync(filePath);
            
            // Read larger chunk to skip settings / 读取较大块以跳过设置数据
            const readSize = Math.min(stat.size, 102400); 
            const buffer = Buffer.alloc(readSize);
            const fd = fs.openSync(filePath, 'r');
            fs.readSync(fd, buffer, 0, readSize, stat.size - readSize);
            fs.closeSync(fd);
            
            const content = buffer.toString('utf-8');
            const lines = content.trim().split('\n');

            let messages = [];
            let count = 0;
            const MAX_LINES = 8;

            // Extract valid chat lines / 提取有效对话行
            for (let i = lines.length - 1; i >= 0; i--) {
                if (count >= MAX_LINES) break;
                const line = lines[i].trim();
                if (!line) continue;
                try {
                    const json = JSON.parse(line);
                    let mes = json.mes || (json.data && json.data.mes);
                    let name = json.name || (json.data && json.data.name) || "System";
                    
                    if (mes && typeof mes === 'string') {
                        mes = mes.replace(/<[^>]*>/g, ''); // Remove HTML tags / 去除 HTML 标签
                        messages.unshift(`【${name}】:\n${mes}`);
                        count++;
                    }
                } catch (e) {}
            }
            
            let previewText = messages.length > 0 ? messages.join('\n\n-----------------------\n\n') : "⚠️ Unable to preview / 无法预览或文件为空";
            res.json({ success: true, preview: previewText });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Restore file / 恢复文件
    app.post('/restore', (req, res) => {
        try {
            const { filename, targetChatName } = req.body;
            if (!filename || !targetChatName) throw new Error("Missing params");
            
            const sourcePath = path.join(BACKUP_DIR, path.basename(filename));
            const targetDir = path.join(CHAT_DIR, targetChatName);
            
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            // Create new filename with timestamp / 创建带时间戳的新文件名
            const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0,19);
            const newName = `Recovered_${timeStr}_${path.basename(filename)}`;
            
            fs.copyFileSync(sourcePath, path.join(targetDir, newName));
            res.json({ success: true, newFilename: newName });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
}

module.exports = { init, info };
                let isUser = json.is_user;
                if (json.data && json.data.is_user !== undefined) isUser = json.data.is_user;

                if (isUser === false) {
                    let name = json.name || (json.data && json.data.name);
                    if (name && name !== 'System') return name;
                }
            } catch (e) {}
        }
    } catch (err) {
        return null;
    }
    return null;
}

function init(app, config) {
    console.log('[RecordRecovery] Plugin Initializing...');
    installFrontend();

    // API: List backups with metadata / 获取备份列表及元数据
    app.post('/list', (req, res) => {
        if (!fs.existsSync(BACKUP_DIR)) return res.json({ success: true, files: [] });
        try {
            const files = fs.readdirSync(BACKUP_DIR)
                .filter(f => f.endsWith('.jsonl'))
                .map(file => {
                    const filePath = path.join(BACKUP_DIR, file);
                    const stat = fs.statSync(filePath);
                    const detectedChar = detectCharacterName(filePath);

                    return { 
                        name: file, 
                        mtime: stat.mtime, 
                        size: stat.size,
                        charName: detectedChar
                    };
                })
                .sort((a, b) => b.mtime - a.mtime);
            res.json({ success: true, files });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Smart Preview (Last 100KB) / 智能预览（最后 100KB）
    app.post('/preview', (req, res) => {
        try {
            const filePath = path.join(BACKUP_DIR, path.basename(req.body.filename));
            if (!fs.existsSync(filePath)) throw new Error('File not found');
            const stat = fs.statSync(filePath);
            
            // Read larger chunk to skip settings / 读取较大块以跳过设置数据
            const readSize = Math.min(stat.size, 102400); 
            const buffer = Buffer.alloc(readSize);
            const fd = fs.openSync(filePath, 'r');
            fs.readSync(fd, buffer, 0, readSize, stat.size - readSize);
            fs.closeSync(fd);
            
            const content = buffer.toString('utf-8');
            const lines = content.trim().split('\n');

            let messages = [];
            let count = 0;
            const MAX_LINES = 8;

            // Extract valid chat lines / 提取有效对话行
            for (let i = lines.length - 1; i >= 0; i--) {
                if (count >= MAX_LINES) break;
                const line = lines[i].trim();
                if (!line) continue;
                try {
                    const json = JSON.parse(line);
                    let mes = json.mes || (json.data && json.data.mes);
                    let name = json.name || (json.data && json.data.name) || "System";
                    
                    if (mes && typeof mes === 'string') {
                        mes = mes.replace(/<[^>]*>/g, ''); // Remove HTML tags / 去除 HTML 标签
                        messages.unshift(`【${name}】:\n${mes}`);
                        count++;
                    }
                } catch (e) {}
            }
            
            let previewText = messages.length > 0 ? messages.join('\n\n-----------------------\n\n') : "⚠️ Unable to preview / 无法预览或文件为空";
            res.json({ success: true, preview: previewText });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // API: Restore file / 恢复文件
    app.post('/restore', (req, res) => {
        try {
            const { filename, targetChatName } = req.body;
            if (!filename || !targetChatName) throw new Error("Missing params");
            
            const sourcePath = path.join(BACKUP_DIR, path.basename(filename));
            const targetDir = path.join(CHAT_DIR, targetChatName);
            
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            // Create new filename with timestamp / 创建带时间戳的新文件名
            const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0,19);
            const newName = `Recovered_${timeStr}_${path.basename(filename)}`;
            
            fs.copyFileSync(sourcePath, path.join(targetDir, newName));
            res.json({ success: true, newFilename: newName });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
}


module.exports = { init, info };
