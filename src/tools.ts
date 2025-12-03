import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from "zod";
import { SophtronClient } from "./apiClient"

const connections = {} as any

function getCustomerName(authInfo: any){
  const customerName = `${authInfo.payload.client_id}_${authInfo.payload.sub}`;
  return customerName;
}

const tools: {
  [key: string] : {
    description: string,
    schema: any,
    fn: Function,
    annotations?: any | undefined
  }
} = {
  SaveConnection: {
    description: "Should use this tool to persist the final state of the ucw-widget (status = memberConnected) ",
    schema: {
      memberId: z.string().describe("Member Id (connectionId)"),
      accountId: z.string().describe("accountId, the account selected during the widget process"),
      aggregator: z.string().describe("aggregator -- sophtron"),
      institutionName: z.string().describe("connected institution name"),
      institutionId: z.string().describe("connected institution id"),
    },
    fn: async function(sophtron_client: SophtronClient, customerId: string, zodResult: any){
      connections[zodResult.institutionName] = {
        memberId: zodResult.memberId,
        accountId: zodResult.accountId,
        aggregator: zodResult.aggregator,
        institutionName: zodResult.institutionName,
        institutionId: zodResult.institutionId,
      }
      return connections;
    },
    annotations: {
      destructiveHint: false,
      openWorldHint: false,
      readOnlyHint: false,
    },
  },
  GetConnections: {
    description: "Retrieves the previous saved connectionInfo from the results of the widget instances, use the info as input for other tools, if the list doesn't contain the asked institution info. launch ucw-widget to let user connect",
    schema: {
    },
    fn: async function(sophtron_client: SophtronClient, customerId: string, zodResult: any){
      return connections
    },
    annotations: {
      destructiveHint: false,
      openWorldHint: false,
      readOnlyHint: true,
    }
  },
  GetProfile : {
    description: "Retrieves the public profile information from a connected member",
    schema: {
      memberId: z.string().describe("Member Id, connectionId, from the widget last state"),
    },
    fn: async function(sophtron_client: SophtronClient, customerId: string, zodResult: any){
      const ret = await sophtron_client.getIdentityV3(customerId, zodResult.memberId)
      return ret
    }
  },
  GetAccount: {
    description: "Retrieves account information that belong to a member by account id",
    schema: {
      memberId: z.string().describe("MemberId/connectionId, from the widget last state"),
      accountId: z.string().describe("AccountId, from the widget last state"),
    },
    fn: function(sophtron_client: SophtronClient, customerId: string, zodResult: any){
      const ret = sophtron_client.getAccountV3(customerId, zodResult.memberId, zodResult.accountId)
      return ret
    }
  },
  GetTransactions: {
    description: "Retrieves recent transactions that belong to an accounnt",
    schema: {
      accountId: z.string().describe("Account Id, from the widget last state"),
    },
    fn: function(sophtron_client: SophtronClient, customerId: string, zodResult: any){
      const start = new Date("2020-05-05");
      const ret = sophtron_client.getTransactionsV3(customerId, zodResult.accountId, start, new Date())
      return ret
    }
  }
}

export function useListToolsHandler(server: McpServer) {
  for(const tk of Object.keys(tools)){
    const t = tools[tk];
    server.registerTool(
        tk,
        {
            title: tk,
            description: t.description,
            inputSchema: t.schema,
            //outputSchema: { echo: z.string() }
        },
        async function(data,  req) {
          const customerName = getCustomerName(req.authInfo);
          const sophtron_client = new SophtronClient({} as any);
          const customer = await sophtron_client.getCustomer(customerName);
          if(customer){
            const ret = await t.fn(sophtron_client, customer.CustomerID, data)
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(ret)
                }
              ]
            }
          }else{
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify("")
                }
              ]
            }
          }
        }
    );
  }
}