const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const webRoot = __dirname;
const maxRequestBytes = 32 * 1024;
const maxMessageCharacters = 5000;
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function loadLocalEnvironment() {
  const envPath = path.join(webRoot, ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;

    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

async function readJsonRequest(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxRequestBytes) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must contain valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function validateMessages(body) {
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return "Send at least one message.";
  }
  if (body.messages.length > 20) {
    return "A conversation can contain at most 20 messages.";
  }
  for (const message of body.messages) {
    if (
      !message ||
      !["user", "assistant"].includes(message.role) ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length > maxMessageCharacters
    ) {
      return "Each message must have a supported role and contain 1–5000 characters.";
    }
  }
  return null;
}

function demoAnswer(question) {
  const normalized = question.toLowerCase();
  if (/photosynth|chlorophyll/.test(normalized)) {
    return "Photosynthesis is how plants use light energy to turn carbon dioxide and water into glucose and oxygen. Chlorophyll captures the light; the glucose stores energy for the plant.";
  }
  if (/market structure|monopol|oligopol|perfect competition/.test(normalized)) {
    return "Market structures describe how firms compete. Perfect competition has many firms and little pricing power; monopolistic competition adds differentiated products; oligopoly has a few interdependent firms; a monopoly has one dominant supplier and strong barriers to entry.";
  }
  if (/supply and demand|equilibrium/.test(normalized)) {
    return "Market equilibrium is where quantity supplied equals quantity demanded. A price above equilibrium creates a surplus; a price below it creates a shortage. Changes in other factors shift the supply or demand curve.";
  }
  return "Offline demo mode is active. Try asking about photosynthesis, market structures, or supply and demand. Add an OPENAI_API_KEY to your local .env file for generated answers.";
}

async function getChatAnswer(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("API key loaded:", Boolean(apiKey), "Length:", apiKey?.trim().length);
  if (!apiKey) {
    return { answer: demoAnswer(messages.at(-1).content), demo: true };
  }

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a careful study assistant. Explain concepts clearly, encourage learning, and do not claim to have read files that were not provided.",
        },
        ...messages,
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!upstream.ok) {
    throw new Error(`The AI provider returned HTTP ${upstream.status}.`);
  }

  const result = await upstream.json();
  const answer = result.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("The AI provider returned an empty answer.");
  }
  return { answer, demo: false };
}

async function serveStatic(request, response, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname).replace(/\\/g, "/");
  } catch {
    response.writeHead(400, { "X-Content-Type-Options": "nosniff" });
    response.end("Invalid URL.");
    return;
  }

  const segments = decodedPath.split("/");
  if (segments.some((segment) => segment === ".." || segment.startsWith("."))) {
    response.writeHead(404, { "X-Content-Type-Options": "nosniff" });
    response.end("Not found.");
    return;
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = path.resolve(webRoot, relativePath);
  const relativeToRoot = path.relative(webRoot, filePath);
  if (
    relativeToRoot.startsWith("..") ||
    path.isAbsolute(relativeToRoot)
  ) {
    response.writeHead(404, { "X-Content-Type-Options": "nosniff" });
    response.end("Not found.");
    return;
  }

  let fileStat;
  try {
    fileStat = await fs.promises.stat(filePath);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      response.writeHead(404, { "X-Content-Type-Options": "nosniff" });
      response.end("Not found.");
      return;
    }
    throw error;
  }
  if (!fileStat.isFile()) {
    response.writeHead(404, { "X-Content-Type-Options": "nosniff" });
    response.end("Not found.");
    return;
  }

  response.writeHead(200, {
    "Content-Length": fileStat.size,
    "Content-Type":
      contentTypes[path.extname(filePath).toLowerCase()] ||
      "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = fs.createReadStream(filePath);
  stream.on("error", (error) => {
    console.error(`Could not read ${path.basename(filePath)}: ${error.message}`);
    if (response.headersSent) {
      response.destroy(error);
    } else {
      response.writeHead(500, { "X-Content-Type-Options": "nosniff" });
      response.end("Unable to read this page.");
    }
  });
  stream.pipe(response);
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, "http://localhost");
  if (requestUrl.pathname === "/api/chat") {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      sendJson(response, 405, { error: "Use POST to send a chat message." });
      return;
    }

    try {
      const body = await readJsonRequest(request);
      const validationError = validateMessages(body);
      if (validationError) {
        sendJson(response, 400, { error: validationError });
        return;
      }
      sendJson(response, 200, await getChatAnswer(body.messages));
    } catch (error) {
      const status = error.statusCode || 502;
      console.error(`Chat request failed: ${error.message}`);
      sendJson(response, status, {
        error:
          status === 400 || status === 413
            ? error.message
            : "The chat service could not provide an answer. Please try again.",
      });
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    response.writeHead(405, { "X-Content-Type-Options": "nosniff" });
    response.end("Method not allowed.");
    return;
  }

  await serveStatic(request, response, requestUrl.pathname);
}

loadLocalEnvironment();
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
const host = process.env.HOST || "127.0.0.1";

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(`Request failed: ${error.message}`);
    if (!response.headersSent) {
      response.writeHead(500, { "X-Content-Type-Options": "nosniff" });
      response.end("The server could not complete this request.");
    } else {
      response.destroy(error);
    }
  });
});

server.on("error", (error) => {
  console.error(`Could not start the StudyHub AI server: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`StudyHub AI is available at http://${host}:${port}`);
});
