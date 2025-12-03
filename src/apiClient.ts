import SophtronBaseClient from "./apiClient.base";

export class SophtronClient extends SophtronBaseClient {

  async getCustomer(name: string) {
    const customers = await this.get(`/v2/customers/?uniqueId=${name}`)
    return customers?.[0]
  }
  getMembers(customerId: string) {
    return this.get(`/v2/customers/${customerId}/members`)
  }
  getTransactions(customerId: string, accountId: string, startTime: Date, endTime: Date) {
    const path = `/v2/customers/${customerId}/accounts/${accountId}/transactions?startDate=${startTime.toISOString().substring(0, 10)}&endDate=${endTime.toISOString().substring(0, 10)}`
    return this.get(path)
  }
  getIdentityV3(customerId: string, memberId: string) {
    return this.get(`/v3/Customers/${customerId}/Members/${memberId}/identity`)
  }
  getAccountV3(customerId: string, memberId: string, accountId: string) {
    return this.get(`/v3/customers/${customerId}/Members/${memberId}/accounts/${accountId}`)
  }
  getMemberAccountsV3(customerId: string, memberId: string) {
    return this.get(`/v3/customers/${customerId}/Members/${memberId}/accounts`)
  }
  getAccountsV3(customerId: string) {
    return this.get(`/v3/customers/${customerId}/accounts`)
  }
  getTransactionsV3(customerId: string, accountId: string, startTime: Date, endTime: Date) {
    const path = `/v3/customers/${customerId}/accounts/${accountId}/transactions?startDate=${startTime.toISOString().substring(0, 10)}&endDate=${endTime.toISOString().substring(0, 10)}`
    return this.get(path)
  }
}
