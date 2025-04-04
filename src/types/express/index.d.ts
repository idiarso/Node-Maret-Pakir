import { User } from "../../server/entities/User";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
} 