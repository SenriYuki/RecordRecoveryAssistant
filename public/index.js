(function () {
    const DIV_ID = 'recovery-modal-ui';
    const PLUGIN_ID = 'record-recovery-assistant'; 

    window.recoveryPlugin = {
        /**
         * Initialize and show the modal window.
         * 初始化并显示模态窗口。
         */
        async show() {
            // Get current character name / 获取当前角色名称
            const context = SillyTavern.getContext();
            this.currentCharName = context.name2 || (context.characters && context.characters[context.characterId] ? context.characters[context.characterId].name : null) || context.chatId;

            if(!this.currentCharName) { alert("请先打开一个聊天窗口！"); return; }

            try {
                const res = await fetch(`/api/plugins/${PLUGIN_ID}/list`, { method: 'POST' });
                if (!res.ok) throw new Error('Backend connection failed');
                const data = await res.json();
                
                this.files = data.files.map(f => ({...f, date: new Date(f.mtime)}));
                this.renderUI(this.currentCharName);
            } catch (e) {
                alert("无法连接后端插件。");
                console.error(e);
            }
        },

        /**
         * Render the HTML UI.
         * 渲染 HTML 界面。
         */
        renderUI(chatName) {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const formatTime = (date) => {
                const pad = (n) => n.toString().padStart(2, '0');
                return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
            };

            const html = `
            <div id="${DIV_ID}" class="recovery-mask">
                <div class="recovery-win">
                    <div class="rec-head">
                        <h3><i class="fa-solid fa-clock-rotate-left"></i> 记录找回助手 <small style="opacity:0.5; font-size:0.7em; margin-left:10px;">当前角色: ${chatName}</small></h3>
                        <div class="rec-close" onclick="document.getElementById('${DIV_ID}').remove()" title="关闭">×</div>
                    </div>
                    
                    <div class="rec-controls">
                        <div class="control-group">
                            <label><i class="fa-regular fa-calendar"></i> 起始时间</label>
                            <input type="datetime-local" id="rec-start" class="rec-input" value="${formatTime(yesterday)}">
                        </div>
                        <div class="control-group">
                            <label><i class="fa-regular fa-calendar-check"></i> 结束时间</label>
                            <input type="datetime-local" id="rec-end" class="rec-input" value="${formatTime(now)}">
                        </div>
                        <div class="control-group-btn" style="display:flex; flex-direction:column; gap:5px;">
                            <button class="menu_button" onclick="window.recoveryPlugin.filter()">
                                <i class="fa-solid fa-search"></i> 搜索存档
                            </button>
                            <label style="display:flex; align-items:center; gap:5px; font-size:0.85em; cursor:pointer; margin-top:5px; user-select:none;">
                                <input type="checkbox" id="rec-only-current" checked>
                                只显示“${chatName}”
                            </label>
                        </div>
                    </div>

                    <div class="rec-body">
                        <div id="rec-list" class="rec-list">
                            <div style="padding:20px; text-align:center; opacity:0.5; margin-top: 50px;">
                                <i class="fa-solid fa-filter" style="font-size: 2em; margin-bottom: 10px;"></i><br>
                                请点击“搜索存档”<br>
                                <small>(系统将自动识别备份文件内的角色)</small>
                            </div>
                        </div>
                        <div class="rec-preview">
                            <div style="margin-bottom:10px; font-weight:bold; opacity:0.8; display:flex; align-items:center; gap:5px;">
                                <i class="fa-solid fa-file-lines"></i> 最后一条消息预览
                            </div>
                            <div id="rec-prev-text" class="preview-box">点击左侧列表查看内容...</div>
                        </div>
                    </div>

                    <div class="rec-foot">
                        <button id="rec-btn" disabled onclick="window.recoveryPlugin.restore('${chatName}')">
                            <i class="fa-solid fa-ban"></i> 请先选择一个存档
                        </button>
                        <div class="rec-credits">
                            Plugin by SenriYuki
                        </div>
                    </div>
                </div>
            </div>`;
            
            const exist = document.getElementById(DIV_ID);
            if(exist) exist.remove();
            $('body').append(html);
        },

        /**
         * Filter files based on time and character name.
         * 根据时间和角色名称筛选文件。
         */
        filter() {
            const startVal = document.getElementById('rec-start').value;
            const endVal = document.getElementById('rec-end').value;
            const onlyCurrent = document.getElementById('rec-only-current').checked;

            if(!startVal || !endVal) { alert("请填写完整的时间范围"); return; }
            
            const start = new Date(startVal);
            const end = new Date(endVal);
            const list = document.getElementById('rec-list');
            list.innerHTML = '';
            
            const matches = this.files.filter(f => {
                const inTime = f.date >= start && f.date <= end;
                if (!inTime) return false;
                if (onlyCurrent) {
                    if (!f.charName) return false;
                    return f.charName.includes(this.currentCharName) || this.currentCharName.includes(f.charName);
                }
                return true;
            });
            
            if(matches.length === 0) { 
                list.innerHTML = `<div style="padding:20px; text-align:center; opacity:0.5;">
                    找不到符合的存档。<br>
                    ${onlyCurrent ? '(尝试取消“只显示当前角色”再搜一次)' : ''}
                </div>`; 
                return; 
            }

            matches.forEach(f => {
                const item = document.createElement('div');
                item.className = 'rec-item';
                let charTag = '';
                if (f.charName) {
                    const isCurrent = f.charName.includes(this.currentCharName) || this.currentCharName.includes(f.charName);
                    const color = isCurrent ? '#6fa8dc' : '#ffb347';
                    charTag = `<span style="color:${color}; font-size:0.8em; border:1px solid ${color}; padding:0 4px; border-radius:4px; margin-right:5px;">${f.charName}</span>`;
                } else {
                    charTag = `<span style="color:#666; font-size:0.8em; border:1px solid #666; padding:0 4px; border-radius:4px; margin-right:5px;">未知</span>`;
                }

                item.innerHTML = `
                    <span class="rec-item-date">${f.date.toLocaleString('zh-CN')}</span>
                    <div style="margin-bottom:2px;">${charTag}</div>
                    <span class="rec-item-name">${f.name}</span>
                `;
                item.onclick = () => this.select(f.name, item);
                list.appendChild(item);
            });
        },

        /**
         * Select a file and fetch its preview.
         * 选择文件并获取预览。
         */
        async select(name, el) {
            document.querySelectorAll('.rec-item').forEach(e => e.classList.remove('active'));
            el.classList.add('active');
            this.selected = name;
            
            const btn = document.getElementById('rec-btn');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 正在读取预览...';
            btn.style.cursor = 'wait';
            
            const res = await fetch(`/api/plugins/${PLUGIN_ID}/preview`, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({filename: name})
            });
            const d = await res.json();
            
            document.getElementById('rec-prev-text').innerText = d.preview;
            btn.innerHTML = `<i class="fa-solid fa-file-circle-check"></i> 确认恢复 "${name}" (另存新档)`;
            btn.style.cursor = 'pointer';
        },

        /**
         * Execute restore operation.
         * 执行恢复操作。
         */
        async restore(target) {
            if(!confirm(`确定要恢复文件 "${this.selected}" 吗？`)) return;
            const res = await fetch(`/api/plugins/${PLUGIN_ID}/restore`, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({filename: this.selected, targetChatName: target})
            });
            const d = await res.json();
            
            if(d.success) {
                alert(`✅ 恢复成功！\n\n新文件名为: ${d.newFilename}\n\n请前往下方的“管理聊天文件”\n进入聊天记录选择复原的对话。`);
                document.getElementById(DIV_ID).remove();
            } else {
                alert("❌ 恢复失败: " + d.error);
            }
        }
    };

    // Auto-inject button into Extensions Menu / 自动注入按钮到扩展菜单
    const checkBtn = setInterval(() => {
        const bar = document.getElementById('extensionsMenu');
        if(bar && !document.getElementById('rec-open-btn')) {
            const btn = document.createElement('div');
            btn.id = 'rec-open-btn';
            btn.className = 'list-group-item flex-container flex-gap-10 interactable';
            btn.innerHTML = '<div class="fa-solid fa-clock-rotate-left"></div><div>记录找回助手</div>';
            btn.onclick = () => window.recoveryPlugin.show();
            bar.appendChild(btn);
            clearInterval(checkBtn);
        }
    }, 2000);
})();