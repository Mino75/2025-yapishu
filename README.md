# 🖌️ Yapishu (я пишу) - Character Calligraphy PWA

> A Progressive Web App for practicing character writing in Japanese, Chinese, and Russian

## ✨ Features

### 📚 Multi-Language Support
- 🇯🇵 **Japanese** - JLPT level characters with hiragana/kanji practice
- 🇨🇳 **Chinese Simplified** - HSK level characters with pinyin
- 🇷🇺 **Russian** - TORFL level Cyrillic characters

### 🎯 Smart Training System
- 📊 Adaptive learning algorithm (prioritizes least practiced characters)
- 🏷️ Filter by difficulty levels (JLPT, HSK, TORFL)
- 📈 Progress tracking with exercise counters
- 🎉 Visual rewards for milestones (20, 30, 50+ exercises)

### ✏️ Drawing Practice
- 📱 Touch & mouse support for character drawing
- 👻 Ghost character overlay for tracing guidance
- 🎨 Customizable fonts for each language
- 📐 Auto-scaling to fit canvas 

### 🔊 Pronunciation Help
- 🗣️ Text-to-Speech (TTS) support for all languages
- 📝 Romanization display (pinyin, romaji, etc.)
- 🌐 Translation meanings included

### 📱 Offline-First PWA
- ⚡ Works completely offline after first load
- 💾 IndexedDB for persistent data storage
- 🔄 Smart cache management with version control
- 📲 Installable on mobile devices

### 📊 Data Management
- 📤 Export progress as JSON
- 📥 Import previous progress data
- 🗑️ Clear data option with cache cleanup
- 💾 Automatic progress saving

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd yapishu

# Install dependencies
npm install

# Start the server
npm start
```

The app will be available at `http://localhost:3000`

## 🐳 Docker Deployment

```bash
# Build the Docker image
docker build -t yapishu .

# Run the container
docker run -p 3000:3000 yapishu
```

## 📂 Project Structure

```
yapishu/
├── 📄 index.html          # Main HTML entry point
├── 🎮 main.js             # Core application logic
├── 💾 db.js               # IndexedDB management
├── 🎨 style.js            # Dynamic styling & themes
├── ⚙️ server.js           # Express server with cache versioning
├── 👷 service-worker.js   # Offline functionality & caching
├── 📦 manifest.json       # PWA manifest
├── 🇯🇵 japanese-jlpt.json # Japanese character data
├── 🇨🇳 mandarin-simplified-hsk.json # Chinese character data
├── 🇷🇺 russian-torfl.json # Russian character data
└── 🐋 Dockerfile          # Container configuration
```

## 🎮 How to Use

1. **Select Language** 🌐 - Choose Japanese, Chinese, or Russian
2. **Choose Font** ✒️ - Pick your preferred display font
3. **Filter Levels** 📊 - Select difficulty level (optional)
4. **Practice Writing** ✍️ - Trace the ghost character on canvas
5. **Listen & Learn** 🔊 - Click speaker icon for pronunciation
6. **Track Progress** 📈 - Complete exercises to build streaks
7. **Review Characters** 📋 - Browse all characters with review mode

## 🛠️ Configuration

### Environment Variables

```bash
# Cache versioning
CACHE_VERSION=v2
APP_NAME=yapishu

# Service Worker timeouts
SW_FIRST_TIME_TIMEOUT=20000     # 20 seconds for first load
SW_RETURNING_USER_TIMEOUT=5000   # 5 seconds for returning users
SW_ENABLE_LOGS=true              # Enable debug logging
```

### Cache Strategy
- 🆕 **First Visit**: Extended timeout (20-30s) for slow networks
- 🔄 **Return Visits**: Quick timeout (3-5s) with cache fallback
- ⚛️ **Atomic Updates**: All-or-nothing cache replacement
- 🔒 **Version Locking**: Prevents cache corruption

## 🌟 Key Features Explained

### 📊 Adaptive Learning Algorithm
The app automatically selects characters with the lowest exercise count, ensuring balanced practice across all characters.

### 🔄 Offline Synchronization
- Complete offline functionality after initial load
- Background updates when network available
- Resilient to network interruptions

### 📱 PWA Capabilities
- Home screen installation
- Full-screen mode support
- Native app-like experience
- Push notification ready (future feature)

## 📄 License

This project is open source. Please check the license file for details.

## 🙏 Acknowledgments

- 📚 JLPT, HSK, and TORFL for standardized level systems
- 🔤 Google Fonts for typography support
- 💾 IndexedDB for robust client-side storage

---

**я пишу** - _"I write"_ in Russian, symbolizing the universal journey of learning to write in any language 🌍✍️
