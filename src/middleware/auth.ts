import { expressjwt as jwt } from 'express-jwt';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { jwksClient } from '../config/auth0.js';

export const authenticateJWT = () => {
  const middleware = jwt({
    secret: async (req) => {
      const token = req.headers.authorization?.split(' ')[1] || '';
      const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
      const key = await jwksClient.getSigningKey(header.kid);
      return key.getPublicKey();
    },
    audience: env.AUTH0_AUDIENCE,
    issuer: `https://${env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
  });

  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err) => {
      if (err) {
        if (err.name === 'UnauthorizedError') {
          return res.status(401).json({
            success: false,
            error: {
              code: 'auth/unauthorized',
              message: 'Invalid or expired token'
            }
          });
        }
        return next(err);
      }
      next();
    });
  };
};