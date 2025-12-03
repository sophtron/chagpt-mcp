import axios from "axios";
import { AxiosInstance } from "axios";

export default class HttpClient {
  httpInstance: AxiosInstance;

  constructor() {
    this.httpInstance = axios.create({
      timeout: 30000,
    });
  }

  async stream(url: string, data: any, target: any) {
    // logger.debug(`stream request: ${url}`);
    return await axios({
      method: data != null ? "post" : "get",
      data,
      url,
      responseType: "stream",
    })
      .then((res) => {
        // logger.debug(`Received stream response from ${url}`);
        return res;
      })
      .catch((error) => {
        if (error.response != null) {
          console.log(`error from ${url}`, error.response.status);
          return error.response;
        }
        console.log(`error from ${url}`, error);

        return undefined;
      })
      .then((res) => {
        if (res?.headers != null) {
          if (res.headers["content-type"] != null) {
            target.setHeader("content-type", res.headers["content-type"]);
          }
          return res.data.pipe(target);
        }
        target.status(500).send("unexpected error");

        return undefined;
      });
  }

  handleResponse(
    promise: any,
    url: any,
    method: any,
    returnFullResObject: boolean,
  ) {
    return promise
      .then((res: any) => {
        console.log(`Received ${method} response from ${url}`);
        return returnFullResObject === true ? res : res.data;
      })
      .catch((error: any) => {
        console.log(`error ${method} from ${url}`, error);
        throw error;
      });
  }

  async wget(url: string) {
    console.log(`wget request: ${url}`);
    try {
      const response = await this.httpInstance.get(url);
      return response.data;
    } catch (error) {
      console.log(`error from ${url}`, error);
      throw error;
    }
  }

  async get(url: string, headers: any) {
    console.log(`get request: ${url}`);
    try {
      const response = await this.httpInstance.get(url, { headers });
      return response.data;
    } catch (error) {
      console.log(`error from ${url}`, error);
      throw error;
    }
  }

  async del(url: string, headers: any) {
    try {
      return await this.httpInstance.delete(url, { headers });
    } catch (error) {
      console.log(`error from ${url}`, error);
      throw error;
    }
  }

  async put(url: string, data: any, headers: any) {
    try {
      const response = await this.httpInstance.put(url, data, { headers });
      return response.data;
    } catch (error) {
      console.log(`error from ${url}`, error);
      throw error;
    }
  }

  async post(url: string, data: any, headers: any) {
    try {
      const response = await this.httpInstance.post(url, data, { headers });
      return response.data;
    } catch (error) {
      console.log(`error from ${url}`, error);
      throw error;
    }
  }
}
