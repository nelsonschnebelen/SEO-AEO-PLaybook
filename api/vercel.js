/* Vercel / Next.js Edge Function.
   Put this at  app/api/analyze/route.js  (or api/analyze.js with the config
   below) and set GOOGLE_PLACES_API_KEY in the project's environment.      */
import { handleRequest } from './core.js';

export const config = { runtime: 'edge' };

export default async function handler(request) {
  return handleRequest(request, process.env);
}

// App Router equivalents
export const POST = (request) => handleRequest(request, process.env);
export const OPTIONS = (request) => handleRequest(request, process.env);
