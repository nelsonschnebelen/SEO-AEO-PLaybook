/* Cloudflare Worker entry point.
   Deploy:  wrangler deploy
   Secret:  wrangler secret put GOOGLE_PLACES_API_KEY                       */
import { handleRequest } from './core.js';

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};
