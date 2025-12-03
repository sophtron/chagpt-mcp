import dotenv from 'dotenv';
dotenv.config()
import express from "express";
import config from './config';
import axios from 'axios'
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { createServer } from "./mcpServer";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ProxyOAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { auth, requiredScopes } from 'express-oauth2-jwt-bearer';

const jwtCheck = auth({
  audience: config.OauthAudience,
  issuerBaseURL: config.OauthIssuer,
  tokenSigningAlg: 'RS256'
});

const app = express();
app.use(express.json());
app.use(cors());
app.use(async (req, res, next) => {
  if(req.path.startsWith('/.well-known') || req.path.startsWith('/mcp/.well-known')){
    if(req.path === '/.well-known/oauth-protected-resource' || req.path === '/mcp/.well-known/oauth-protected-resource'){
      res.send({
        resource: config.HostUrl,
        authorization_servers: [
          config.OauthIssuer
        ],
        bearer_methods_supported: [
          "header"
        ],
        scopes_supported: [
          "read",
          "write",
        ]
      })
      return
    }
    const response = await axios( {
      url: config.OauthIssuer + req.path.replace('/mcp/', '/'), 
      method: req.method,
      data: req.body,
      validateStatus: () => true
    })
    if(response?.headers){
      if(response.headers['content-type']){
        res.setHeader('content-type', response.headers['content-type']);
      }
      res.status(response.status);
    }
    if(response.status == 200){
      res.send(response.data)
      return;
    }else{
      res.send('Something went wrong')
    }
  }else if(!req.headers.authorization?.toLowerCase()?.startsWith('bearer ')){
    // res.sendStatus(401);
    next()
  }else{
    next()
  }
})

const sharedServer = createServer();

app.use(function (req: any, res: any, next: any) {
  // console.log(`${req.method}: ${req.path}`, req.params, req.query, req.body)
  next();
});
const proxyProvider = new ProxyOAuthServerProvider({
  endpoints: {
    authorizationUrl: config.OauthIssuer + '/authorize',
    tokenUrl: config.OauthIssuer + '/oauth/token',
    revocationUrl: config.OauthIssuer + '/revoke'
  },
  verifyAccessToken: async token => {
    return {
      token,
      clientId: '123',
      scopes: ['openid', 'email', 'profile']
    };
  },
  getClient: async client_id => {
    return {
      client_id,
      redirect_uris: [`${config.HostUrl}/callback`]
    };
  }
});

const mcpServerUrl = new URL(config.HostUrl)

app.use(
  mcpAuthRouter({
    provider: proxyProvider,
    issuerUrl: new URL(config.OauthIssuer),
    baseUrl: mcpServerUrl,
    serviceDocumentationUrl: new URL('https://docs.example.com/')
  })
);

const authMiddleware = jwtCheck;
// const authMiddleware = requireBearerAuth({
//   verifier: proxyProvider,
//   requiredScopes: [],
//   resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpServerUrl)
// });
app.use(authMiddleware)

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
    await transport.handleRequest(req, res, req.body);
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: sessionId => {
          // Store the transport by session ID
          transports[sessionId] = transport;
      }
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    const server = createServer();

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } else {

    // Create a new transport for each request to prevent request ID collisions
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
    });
    res.on('close', () => {
        transport.close();
    });
    await sharedServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }
});

const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);
app.delete('/mcp', handleSessionRequest);
const port = config.Port || 3000;
app.listen(port, () => {
  var message = `Server is running on port ${port}, env: ${config.Env}`;
  console.log(message);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  // Close all active transports to properly clean up resources
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.log(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  console.log('Server shutdown complete');
  process.exit(0);
});