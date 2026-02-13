export function jsonOk(data, status = 200) {
  return Response.json(data, { status });
}

export function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export function noStoreHeaders() {
  return {
    "Cache-Control": "no-store"
  };
}
