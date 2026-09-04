/* Netlify Edge Function.
   Put this at  netlify/edge-functions/analyze.js  and set
   GOOGLE_PLACES_API_KEY in the site's environment variables.              */
import { handleRequest } from './core.js';

export default async (request, context) => {
  const env = {
    GOOGLE_PLACES_API_KEY: Netlify.env.get('GOOGLE_PLACES_API_KEY'),
    ALLOWED_ORIGIN: Netlify.env.get('ALLOWED_ORIGIN')
  };
  return handleRequest(request, env);
};

export const config = { path: '/api/analyze' };
