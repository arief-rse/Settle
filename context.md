<think>I'll need to organize the information you've provided to create a context.md file, which will serve as documentation for the Rectangle Reader Chrome extension. Let me go through the key files and extract the important information about what this application does and how it works.

From analyzing the provided files, I can see this is a Chrome extension called "Rectangle Reader Buddy" that allows users to select a rectangular area on a webpage and extract text from it. The extension then uses Claude (Anthropic's LLM) to analyze the extracted text.

Key components:
1. **UI Components**: Popup interface with tabs for "Analyze" and "History"
2. **Selection Mechanism**: Content script that adds selection overlay to webpages
3. **Text Processing**: AI-powered analysis of extracted text using Anthropic's Claude model
4. **Authentication**: Google Sign-In integration
5. **Storage**: Local storage for history management

I'll organize this information in a clear context.md file that explains:
- What the extension does
- How it works (technical overview)
- Key features
- Architecture overview
- Setup instructions</think># Rectangle Reader Buddy - Chrome Extension

## Overview

Rectangle Reader Buddy is a Chrome extension that lets users select text from webpages using a rectangular selection tool and analyze the selected content with AI. The extension uses Anthropic's Claude model to process and analyze the extracted text.

## Key Features

- **Rectangle Selection Tool**: Draw a rectangle around text on any webpage to select it
- **AI Analysis**: Process selected text with Claude AI model to answer questions and analyze content
- **History Management**: View past text selections and analyses
- **Google Authentication**: Sign in with Google for user identification
- **Theme Support**: Light and dark mode support

## Technical Architecture

### Core Components

1. **Popup Interface** (`src/components/popup/Popup.tsx`)
   - Main entry point for the extension's popup UI
   - Tabs for "Analyze" and "History" views

2. **Selection Tool** (`src/content.tsx`)
   - Content script injected into web pages
   - Creates an overlay for selecting rectangular areas
   - Extracts text from the selected area

3. **Background Service** (`src/background.ts`)
   - Manages authentication state
   - Handles communication between popup and content scripts
   - Stores selected text

4. **AI Processing** (`src/lib/ai-processor.ts`)
   - Integrates with Anthropic's Claude API
   - Analyzes text and provides intelligent responses

5. **UI Components**
   - Uses a customized Shadcn/UI component library
   - Responsive design with Tailwind CSS

## User Flow

1. User clicks the extension icon in the toolbar
2. User starts selection by clicking "Start Selection"
3. A semi-transparent overlay appears on the page
4. User draws a rectangle around text to select it
5. Selected text is captured and sent to the background script
6. The popup displays the captured text
7. User can click "Analyze Text" to process with AI
8. Results are displayed and saved to history

## Authentication

The extension uses Google authentication via Chrome's identity API:
- Sign in with Google
- Support for multiple accounts
- Account switching

## Storage

- Selected text and analysis results are stored in local storage
- User can view history of previous selections and analyses
- Storage is managed by the background script

## Development Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up the `.env` file with your Anthropic API key
4. Build the extension with `npm run build`
5. Load the unpacked extension in Chrome from the `dist` directory

## Building

The project uses Vite with separate build modes:
- Main popup UI
- Content script
- Background service worker

Run `npm run build` to build all components.

## File Structure

- `src/components/popup/` - UI components for the extension popup
- `src/components/ui/` - Shadcn UI component library
- `src/lib/` - Utility functions and core logic
- `src/hooks/` - React hooks for state management
- `src/services/` - Service workers and API integrations

## Technologies

- React for UI components
- TypeScript for type safety
- Tailwind CSS for styling
- Anthropic API for AI processing
- Chrome Extension APIs for browser integration
