export const getTokenFromHeaders = (headers) => {
  const raw = headers["authorization"] || headers["Authorization"];
  if (!raw) return null;
  const parts = raw.split(" ");
  if (parts.length === 1) return parts[0];
  if (parts.length >= 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return parts.pop();
};
