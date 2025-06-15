import { Request, Response } from 'express';
import { UserService } from './user.service.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';
import { logInfo } from '../../utils/logger.js';

const userService = new UserService();

export async function getUserRoles(req: Request, res: Response) {
  // Log the endpoint that was called
  logInfo('API endpoint called', {
    endpoint: '/api/v1/users/me/roles',
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    ip: req.ip,
    headers: req.headers
  });
  
  try {
    const user = getUserFromToken(req);
    
    // Log the user making the request
    logInfo('User making request', {
      userId: user.sub,
      email: user.email,
      name: user.name
    });
    
    const roles = await userService.getUserRoles(user.sub);
    
    // Log the response data
    logInfo('User roles retrieved successfully', {
      userId: user.sub,
      roles: roles
    });
    
    return jsonResponse(res, 200, roles);
  } catch (error) {
    // Log any errors
    logInfo('Error retrieving user roles', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}