import { buildSophtronAuthCode } from "./utils";
import HttpClient from "./httpClient";
import config from './config';

const apiEndpoint = config.ApiServiceEndpoint

export default class SophtronBaseClient {
  apiConfig: any;
  httpClient: HttpClient;
  authHeader: string | undefined;

  constructor(oauthTokenHeader: string | undefined) {
    this.httpClient = new HttpClient();
    this.authHeader = oauthTokenHeader;
  }

  getAuthHeaders(method: string, path: string) {
    return {
      Authorization: buildSophtronAuthCode(
        method,
        path,
        config.SophtronApiUserId,
        config.SophtronApiUserSecret,
      ),
    };
  }

  async post(path: string, data?: any) {
    const authHeader = this.getAuthHeaders("post", path);
    return await this.httpClient.post(apiEndpoint + path, data, authHeader);
  }

  async get(path: string) {
    const authHeader = this.getAuthHeaders("get", path);
    return await this.httpClient.get(apiEndpoint + path, authHeader);
  }

  async put(path: string, data: any) {
    const authHeader = this.getAuthHeaders("put", path);
    return await this.httpClient.put(apiEndpoint + path, data, authHeader);
  }

  async del(path: string) {
    const authHeader = this.getAuthHeaders("delete", path);
    return await this.httpClient.del(apiEndpoint + path, authHeader);
  }
}
