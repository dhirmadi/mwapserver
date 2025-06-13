import { Request, Response } from 'express';
import { UserService } from './user.service.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';

const userService = new UserService();

export async function getUserRoles(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const roles = await userService.getUserRoles(user.sub);
  return jsonResponse(res, 200, roles);
}