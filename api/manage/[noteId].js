import { handleVercelApiRequest } from "../../backend/api/vercel-handler.js";

export default function handler(req, res) {
  return handleVercelApiRequest(req, res);
}
