\# Record Recovery Assistant (记录找回助手)



\*\*Author:\*\* SenriYuki  

\*\*Version:\*\* 1.0



A rescue tool designed for SillyTavern. Accidentally deleted a chat? Lost history due to preset changes? Need to revert to a specific timestamp? This tool helps you recover your chats with one click.  

一个专为 SillyTavern 设计的救援工具。当你意外删除对话、换预设导致纪录消失，或是想找回某个时间点的暂存档时，这个插件能帮你一键恢复。



> \*\*🛑 CRITICAL INSTALLATION WARNING / 重要安装警告\*\*

>

> \*\*This is a BACKEND plugin.\*\*

> \*\*DO NOT\*\* install this via the SillyTavern interface (Extensions -> Install from URL). \*\*IT WILL NOT WORK.\*\*

> Since this plugin needs to scan your backup directories and restore files, you \*\*MUST\*\* install it via the terminal/command line.

>

> \*\*这是一个【后端插件】。\*\*

> \*\*不能\*\*直接在酒馆网页界面使用“扩展” -> “从 URL 安装”功能，\*\*这会导致插件无法运行！\*\*

> 因为本插件需要扫描您的备份目录并执行恢复操作，您\*\*必须\*\*使用下方的命令行方式进行安装。



---



\## ✨ Features (功能特色)



\* \*\*Time Travel Search (时间轴搜寻)\*\*:  

&nbsp; Set a start and end time to precisely locate auto-saves or backups from a specific period.  

&nbsp; 设定最后编辑或开启的起始与结束时间，精准查找备份。



\* \*\*Smart Preview (智慧预览)\*\*:  

&nbsp; Click on any file to preview the first 100KB of the chat content directly inside SillyTavern. No more guessing by file names!  

&nbsp; 点击档案即可预览 100KB 对话内容，支持酒馆内直接预览，不再“盲人摸象”。



\* \*\*Character Filter (角色过滤)\*\*:  

&nbsp; Automatically detects characters in backup files. Supports filtering to show only saves related to a specific character.  

&nbsp; 自动侦测备份档内的角色（Char），支持筛选，只显示特定角色的存档。



\* \*\*Safe Restore (安全恢复)\*\*:  

&nbsp; \*\*Non-destructive recovery.\*\* Restored chats are saved as NEW files. It will NEVER overwrite your existing current records.  

&nbsp; \*\*绝对安全\*\*。恢复时会自动“另存新档”，绝对不会覆盖你现有的任何纪录。



---



\## ⚠️ Security \& Pre-requisites (安全说明与前置要求)



To make this plugin work (scanning backups/restoring files), you \*\*MUST\*\* modify `config.yaml`. Please read the risks below.  

为了让插件能够扫描并恢复文件，你\*\*必须\*\*修改 `config.yaml` 配置文件。请务必阅读以下风险提示：



> \*\*🔴 Risk Disclosure (风险告知):\*\*

> 1.  \*\*Enable Server Plugins (开启后端插件)\*\*: Gives plugins permission to manage files on your device. \*\*Only install plugins from trusted authors.\*\*

>    (允许插件管理你设备上的文件。请只安装值得信任的作者开发的插件。)

> 2.  \*\*Disable CSRF Protection (关闭 CSRF 保护)\*\*: Necessary for backend communication. \*\*Do not expose your SillyTavern to the public internet without a password.\*\*

>    (为了确保插件能与后端顺畅通信，建议关闭此项。请勿在无密码的情况下将酒馆暴露到公网，平时使用无需担心。)



---



\## ⚙️ Configuration Guide (配置指南)



You must enable specific settings in `config.yaml` for the plugin to function.  

你必须在 `config.yaml` 中开启特定设置，否则插件将无法启动。



\### 📱 Android (Termux Users) - 手机端保姆级教程



If you are using Termux on Android, editing files can be tricky. Please follow these steps \*\*exactly\*\*:  

如果你是安卓 Termux 用户，请\*\*严格按照以下步骤\*\*操作，不要跳过任何一步：



1\.  \*\*Stop SillyTavern\*\* (停止酒馆运行):

&nbsp;   Press `Ctrl + C` in Termux to stop the server. (在 Termux 中按 `Ctrl + C` 停止酒馆)



2\.  \*\*Enter Directory\*\* (进入酒馆目录):

&nbsp;   ```bash

&nbsp;   cd ~/SillyTavern

&nbsp;   ```



3\.  \*\*Open Config File\*\* (打开配置文件):

&nbsp;   We will use the `nano` editor. (我们将使用 nano 编辑器)

&nbsp;   ```bash

&nbsp;   nano config.yaml

&nbsp;   ```



4\.  \*\*Step A: Enable Plugins\*\* (步骤 A：开启插件权限):

&nbsp;   \* Press `Ctrl + W` (Search function / 搜索功能).

&nbsp;   \* Type `enableServerPlugins` and press `Enter` (输入这个词并回车).

&nbsp;   \* Change `false` to `true` (将 false 改为 true):

&nbsp;       ```yaml

&nbsp;       enableServerPlugins: true

&nbsp;       ```



5\.  \*\*Step B: Disable CSRF\*\* (步骤 B：关闭 CSRF 保护):

&nbsp;   \* Press `Ctrl + W` again.

&nbsp;   \* Type `disableCsrfProtection` and press `Enter`.

&nbsp;   \* Change `false` to `true` (将 false 改为 true):

&nbsp;       ```yaml

&nbsp;       disableCsrfProtection: true

&nbsp;       ```



6\.  \*\*Save and Exit\*\* (保存并退出):

&nbsp;   \* Press `Ctrl + O` (Save / 保存).

&nbsp;   \* Press `Enter` (Confirm filename / 确认文件名).

&nbsp;   \* Press `Ctrl + X` (Exit editor / 退出编辑器).



7\.  \*\*Restart SillyTavern\*\* (重启酒馆):

&nbsp;   Run `./start.sh` to apply changes. (输入 `./start.sh` 重启)



---



\### 💻 PC (Windows/Linux/Mac) - 电脑端教程



1\.  Go to your SillyTavern folder. (打开你的酒馆文件夹)

2\.  Find `config.yaml` and open it with \*\*Notepad\*\* or any text editor. (找到 `config.yaml` 并用记事本打开)

3\.  Find and modify the following two lines (change them to `true`):

&nbsp;   (搜索并修改以下两行，将值改为 `true`)：



&nbsp;   ```yaml

&nbsp;   enableServerPlugins: true      # Allows the plugin to scan/restore files (允许插件读写文件)

&nbsp;   disableCsrfProtection: true    # Prevents communication errors (防止通讯报错)

&nbsp;   ```

4\.  Save the file and restart SillyTavern. (保存文件并重启酒馆)



---



\## 📦 Installation (安装方法)



\*\*REMINDER: Use the command line below. Do not use the Web UI.\*\* \*\*再次提醒：请使用下方的命令行安装，不要用网页界面安装。\*\*



\### 📱 Android (Termux) One-Command Install \[推荐]

\*\*只需一步！复制下面的整段指令，在 Termux 中长按粘贴并回车：\*\*



```bash

cd ~/SillyTavern/plugins \&\& git clone \[https://github.com/SenriYuki/RecordRecoveryAssistant.git](https://github.com/SenriYuki/RecordRecoveryAssistant.git) \&\& cd RecordRecoveryAssistant \&\& npm install \&\& echo "Plugin Installed! Please Restart ST. (安装完成，请重启酒馆)"

```





\### 💻 PC (Windows/Linux)

\*\*在酒馆目录下打开终端或 CMD：\*\*



```bash

cd plugins

git clone \[https://github.com/SenriYuki/RecordRecoveryAssistant.git](https://github.com/SenriYuki/RecordRecoveryAssistant.git)

cd RecordRecoveryAssistant

npm install

```



> \*\*Note regarding ZIP download (关于手动下载压缩包的说明) \*\*: If you download the source code as a ZIP file manually, you MUST still open a terminal in the plugin folder and run npm install. Otherwise, the plugin will lack dependencies and fail to load. 如果你选择手动下载 ZIP 包解压，解压后必须在插件文件夹内打开终端运行 npm install。否则插件会因为缺少依赖组件而无法运行。



---



\## ❓ FAQ (常见问题)

\### Q: I can't find the chat I'm looking for? (我找不到我要的记录？)

&nbsp; A: Try adjusting the "Time Range" (Start/End time) or use the "Character Filter" to narrow down the results.

&nbsp; (尝试调整“时间范围”（起始/结束时间），或者使用“角色过滤”来缩小搜寻范围。)

\### Q: The preview is empty? (预览是空的？)

&nbsp; A: The file might be corrupted, or empty to begin with. The preview currently supports up to 100KB of text to ensure performance.

&nbsp; (可能是文件已损坏或是本来就是空的。为了确保性能，预览功能目前支持最大 100KB 的文本。)





