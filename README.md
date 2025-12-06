# Sophtron ChatGPT Bank Connection MCP Server

- Brings up sophtron hosted UCW-Widget to allow user to make a connection to a his bank account inside of a chat session.
- Use the connection info to query account info. owner info and transactions.
- Saves connected account to the mcp server in order to query and update data in a different session.
- Sophtron is a data aggregator similar to Plaid. Sophtron provides a non-code widget as well as restful API for developers to let users add banking, investment, loan, insurance, utility accounts. https://sophtron.com/usecase
- Sophtron currently supports over 14,000 financial institutions, and over 30,000 non-financial institutions such as utility, cell phone, cable, etc. Sophtron has 100% coverage of institutions in US and Canada https://sophtron.com/
- For users who call the Sophtron MCP server directly in ChatGPT, users don't need to manually register with Sophtron to use the in-chat-app. User's ChatGPT account will be associated with a uniquely gnereated Sophtron account to track all the connections. Only owner of the ChatGPT account, or other future AI assistant account, will have access to data from that connection.
- Sophtron provides free banking and utility data for users and individual developers of the in-chat-app. 
