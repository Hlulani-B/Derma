# Derma, AI Powered Skin Analysis and Product Recommender

Demo video: https://youtu.be/nNA5UwIJfLU

Derma looks at your skin in real time through your webcam and recommends skincare formulations tailored specifically to you.

## Features

You can take a photo straight from your browser using your webcam, no need to upload anything. The photo gets analysed by Google Gemini 2.5 Flash Lite, which works out your skin type, your main concerns, and which ingredients would actually help. From there it generates personalised skincare formulation recommendations based on that analysis. It then searches for real products that match those recommendations, and pulls in product images using Cheerio so you're not just looking at a list of text.

## Tech stack

The AI and vision work is handled by Google Gemini 2.5 Flash Lite. HTML parsing runs through Cheerio. The webcam capture uses the browser's WebRTC API, and the backend is built on Node.js.

## Getting started

You'll need Node.js v18 or higher, and a Google Gemini API key.

Clone the repo:

```bash
git clone https://github.com/yourusername/derma.git
cd derma
```

Install dependencies:

```bash
npm install
```

Add your Gemini API key:

```bash
echo "GEMINI_API_KEY=your_key_here" > .env
```

Start the app:

```bash
npm start
```

Then open `http://localhost:3000` in your browser.

## How it works

First you allow webcam access and take a photo of your face. That image gets sent to Gemini 2.5 Flash Lite, which identifies your skin type and concerns. Gemini then returns a list of recommended formulations and ingredients based on what it found. Cheerio parses the HTML of a skincare product website to find matching products and pull their images. Finally, those matched products and images are displayed alongside your personalised recommendations.
