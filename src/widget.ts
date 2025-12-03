import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import config from './config';
import {
  ServerNotification,
  ServerRequest
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod/v3";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

function widgetDescriptorMeta(widget: any) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": 'Launching ucw-widget to make a new connection.',
    "openai/toolInvocation/invoked": 'Widget launched, select your institution to continue',
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const widgets: any[] = [
  {
    id: "ucw-widget",
    title: "Universal widget",
    templateUri: "ui://widget/index.html",
  }
];

const JobTypeEnum = z.enum(['accountOwner', 'accountNumber', 'transactions', 'transactionHistory']);

const toolInputParser = {
  jobTypes: z.array(JobTypeEnum).optional(),
};

const tools: any[] = widgets.map((widget) => ({
  name: widget.id,
  description: 'Launch ucw-widget to allow user make a connection through sophtron. the widget will finish with connection info to a selected institution and then can be saved into sophtron to allow user query accounts or transactions later.',
  inputSchema: toolInputParser,
  title: widget.title,
  _meta: widgetDescriptorMeta(widget),
  // To disable the approval prompt for the widgets
  annotations: {
    destructiveHint: false,
    openWorldHint: false,
    readOnlyHint: true,
  },
}));

const resources: any[] = widgets.map((widget) => ({
  uri: widget.templateUri,
  name: widget.title,
  description: `${widget.title} widget markup`,
  mimeType: "text/html+skybridge",
  _meta: widgetDescriptorMeta(widget),
}));

export function useWidgetServer(server: McpServer) {
  for( const res of resources){
    server.registerResource(res.name, res.uri, res, async (url: any, req: any) => {
      // console.log(req.authInfo)
      const htmlResponse = await fetch(config.WidgetHostBaseUrl + '/index.html');
      const html = await htmlResponse.text();
      const widgetHtml = html
        .replaceAll('href="/assets',`href="${config.WidgetHostBaseUrl}/assets`)
        .replaceAll('src="/assets',`src="${config.WidgetHostBaseUrl}/assets`)
        .replaceAll('<div id="root"></div>', `<div id="root"></div>
            <script>
              window.hostUrl = '${config.WidgetHostBaseUrl}';
              window.onPostMessage = function(payload){
                console.log(payload);
                if(payload.type === "connect/memberConnected"){
                  window.openai.setWidgetState({
                    institution: payload.metadata?.ucpInstitutionId,
                    customerId: payload.metadata?.user_guid,
                    memberId: payload.metadata?.member_guid,
                    accountId: payload.metadata?.selectedAccountId,
                    institutionName: payload.metadata?.institutionName,
                    aggregator: payload.metadata?.aggregator,
                    status: payload.type
                  })
                }
              };
          </script>`)
      return {
        contents: [
          {
            uri: res.uri,
            mimeType: "text/html+skybridge",
            text: widgetHtml,
            _meta: res._meta
          },
        ],
      };
    });
  }

  for(const tool of tools){
    server.registerTool(
      tool.name,
      tool,
      async (args: any, req: RequestHandlerExtra<ServerRequest, ServerNotification>) => {
        const authInfo = req.authInfo as any;
        const auth_token = authInfo.token;
        const user_id = `${authInfo.payload.client_id}_${authInfo.payload.sub}`;
        const response = await fetch(config.WidgetHostBaseUrl + '/api/token?userId=' + encodeURIComponent(user_id), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + auth_token,
        }
      });

      const data = await response.json();
        return {
          content: [
            
          ],
          structuredContent: {
            jobTypes: args.jobTypes?.length ? args.jobTypes : ['transactions'],
            state: data.token,
            stateId: user_id,
            singleAccountSelect: true,
            aggregator: 'sophtron',
            institutionId: null,
            connectionId: null
          },
          _meta: {
            "openai/toolInvocation/invoking": 'Calling the widget tool',
            "openai/toolInvocation/invoked": 'Called the widget tool',
          }
        };
      }
    );
  }
}
