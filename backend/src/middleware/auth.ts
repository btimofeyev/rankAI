import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { getSupabase } from '../services/supabaseClient.js';

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new createHttpError.Unauthorized('Missing access token');
    const token = authHeader.replace('Bearer ', '');

    const { client, isMocked } = getSupabase();

    if (isMocked || !client) {
      req.user = { id: token, token };
      return next();
    }

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) throw new createHttpError.Unauthorized('Invalid session');
    req.user = { id: data.user.id, email: data.user.email ?? undefined, token };
    return next();
  } catch (error) {
    next(error);
  }
};
