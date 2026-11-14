import { listTemplates } from '@/lib/db';
import { jsonOk } from '@/lib/http';

export function GET(): Response {
  return jsonOk({ templates: listTemplates() });
}