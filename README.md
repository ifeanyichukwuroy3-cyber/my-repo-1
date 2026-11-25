# Nova AI — Video Studio

A responsive AI-video-creation website starter with:
- Text-to-video prompt composer and generation settings
- Image-to-video upload UI (the server adapter must be extended to send image files to your provider)
- Demo mode, job history in the browser, and free/paid plan presentation
- Server-side API route so provider secrets are not exposed in frontend code

## Run locally

1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Run `npm start`.
4. Visit http://localhost:3000.

No dependencies are required.

## Important: connect a real video provider

The site currently runs in **demo mode**. It does not generate real video until you choose a provider and implement its API adapter. Provider APIs, pricing, output formats, and terms change, so choose a provider and follow its current official documentation.

To connect one:
1. Create an account with an AI video provider and review its age requirements, pricing, usage limits, and terms with a parent/guardian if needed.
2. Copy `.env.example` to `.env` and set `VIDEO_PROVIDER`, `VIDEO_API_KEY`, and `VIDEO_API_URL`.
3. Implement the provider's authenticated request and job polling in the `/api/generate` route in `server.js`. Keep the API key on the server only.
4. Add the provider's job-status polling and final video URL handling. Do not trust arbitrary URLs supplied by a browser.
5. Restart the server and test with a low-cost/free-tier request if the provider offers one.

The generic endpoint intentionally returns a clear setup message rather than pretending to render a video. It does not send your prompt to any third party in demo mode.

## Plans

The Free and Creator cards are display-only examples. No payment processing, subscriptions, login, or usage metering is enabled. Before accepting payments, add a secure payment provider, authentication, server-side plan enforcement, privacy policy, and terms.

## Deployment

Deploy the Node app to a host that supports Node.js. Configure environment variables in the host dashboard; never upload `.env` or commit API keys. Use HTTPS in production.

## Google / Chrome publishing checklist

Chrome can open any public website URL once it is deployed. To make Nova AI discoverable in Google Search, you need to deploy it to a public HTTPS host, connect a domain (optional but recommended), add a sitemap, and submit the site in Google Search Console. Search indexing is not instant or guaranteed.

This project includes a download button that appears when the server's `/api/generate` response includes a valid `videoUrl`. In demo mode no actual video is created, so there is nothing real to download yet. Your provider adapter must return a completed video URL before the button appears.
