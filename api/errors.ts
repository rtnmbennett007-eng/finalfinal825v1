import type { VercelRequest, VercelResponse } from '@vercel/node';
import errorsHandler from './diagnostics/errors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return errorsHandler(req, res);
}
