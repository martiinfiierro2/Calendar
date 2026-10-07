export function allowedData(body, fields) {
  return Object.fromEntries(fields.filter(field => body[field] !== undefined).map(field => [field, body[field]]));
}
