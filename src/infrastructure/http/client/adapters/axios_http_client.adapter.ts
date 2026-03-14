import { type IHttpClient } from '../contracts/i-http-client.js'
import axios, { type AxiosRequestConfig } from 'axios'

export class AxiosHttpClientAdapter implements IHttpClient {
  async post(url: string, data?: unknown, config?: unknown) {
    const response = await axios.post(url, data, config as AxiosRequestConfig)
    return response
  }
}
