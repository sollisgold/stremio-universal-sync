function encodeConfig(configObj) {
    return Buffer.from(JSON.stringify(configObj)).toString('base64url');
}
function decodeConfig(base64Str) {
    try { return JSON.parse(Buffer.from(base64Str, 'base64url').toString('utf8')); }
        catch { return null; }
}
function getConfigFromArgs(args) {
    const raw = args?.config;
  if (!raw) return null;
  return decodeConfig(raw);
}
module.exports = { encodeConfig, decodeConfig, getConfigFromArgs };
