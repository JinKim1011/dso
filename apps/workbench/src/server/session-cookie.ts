export function getSessionCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get("cookie")?.split(";") ?? [];
  const values = cookies.flatMap((cookie) => {
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator).trim() !== name) return [];
    return [cookie.slice(separator + 1).trim()];
  });
  return values.length === 1 && values[0] ? values[0] : null;
}
