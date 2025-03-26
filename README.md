# Gemini Cursor

An AI cursor for desktop using Gemini 2.5 Pro (Experimental)

![Demo](./readme/demo.gif)

## Overview

Gemini Cursor is an experimental application that allows you to control your mouse cursor with natural language using Gemini AI. The app captures your screen and uses computer vision AI to analyze the content, allowing you to refer to elements on your screen.

## Changes from Original Repository

This fork contains the following important modifications:

1. Updated to use the latest `gemini-2.5-pro-exp-03-25` model
2. Added secure environment variable handling for the API key
3. Enhanced multi-screen capture capability

## Installation

```bash
# Clone the repository
git clone https://github.com/JoshK1996/gemini-cursor.git

# Navigate to the project directory
cd gemini-cursor

# Install dependencies
npm install

# Start the application
npm start
```

## Setting Up Your API Key (IMPORTANT)

To use Gemini Cursor, you need a Gemini API key. For security reasons, we **strongly recommend** using an environment variable instead of hardcoding your API key.

### Setting Environment Variables

#### Windows
1. Open Command Prompt as Administrator
2. Set a persistent environment variable:
   ```
   setx GEMINI_API_KEY "your-api-key-here"
   ```
3. Restart your terminal or computer for the change to take effect

#### macOS/Linux
1. Edit your shell profile file (`.bash_profile`, `.zshrc`, etc.):
   ```bash
   echo 'export GEMINI_API_KEY="your-api-key-here"' >> ~/.zshrc
   ```
2. Reload your shell configuration:
   ```bash
   source ~/.zshrc
   ```

### Alternative: Entering the API Key in the App

You can also enter your API key directly in the app's input field, but be aware that it will be stored in the browser's local storage, which is less secure than using environment variables.

## Multi-Screen Support

This version attempts to capture all connected displays when you initiate screen capture. The implementation uses standard Web APIs with additional parameters to prioritize capturing the entire desktop environment rather than just a single window or screen.

Due to browser security restrictions, you will still need to select what to share when prompted, but the app is now configured to prefer capturing all monitors when available.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

The Gemini API integration uses components licensed under the Apache License 2.0 - see the LICENSE_GOOGLE file for details.