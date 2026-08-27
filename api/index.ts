import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/app.ts';

export default function handler(req: VercelRequest, res: VercelResponse) {
  let url = req.url || '/api';
  if (!url.startsWith('/api')) {
    url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  }
  req.url = url;
  return app(req, res);
}
