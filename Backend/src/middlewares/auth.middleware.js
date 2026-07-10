const jwksClient = require("jwks-rsa");
const jwt = require("jsonwebtoken");

const client = jwksClient({
  jwksUri: "https://mint-grouse-72.clerk.accounts.dev/.well-known/jwks.json",
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      console.error("[authMiddleware] Error retrieving signing key:", {
        kid: header.kid,
        error: err.message,
        code: err.code
      });
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

async function authUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("[authMiddleware] No Bearer token found in header.");
    return res.status(401).json({ message: "Token not provided." });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, getKey, { algorithms: ["RS256"], clockTolerance: 60 }, (err, decoded) => {
    if (err) {
      console.error("[authMiddleware] JWT Verification Error:", err.message);

      // Distinguish network/JWKS errors from actual token errors
      if (err.message.includes("signing key") || err.code === "ECONNRESET") {
        return res.status(503).json({
          message: "Authentication server (Clerk) is unreachable. Please check your network connection.",
          error: err.message,
        });
      }

      // For deeper debugging, log the token header if possible
      try {
        const header = JSON.parse(
          Buffer.from(token.split(".")[0], "base64").toString(),
        );
        console.log("[authMiddleware] Token Header:", header);
      } catch (e) {}

      return res.status(401).json({ message: "Invalid or expired token." });
    }

    req.auth = { userId: decoded.sub };
    next();
  });
}

module.exports = { authUser };
