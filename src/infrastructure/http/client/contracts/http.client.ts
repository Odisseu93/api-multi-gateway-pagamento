export interface HttpClient {
  post(url: string, data?: unknown, config?: unknown): Promise<any>
  // another methods should be here, but for now just post
}
