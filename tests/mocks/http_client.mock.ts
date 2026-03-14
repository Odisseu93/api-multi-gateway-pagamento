import { type IHttpClient } from '#infrastructure/http/client/contracts/i-http-client'

export function httpClientMock(responses: unknown[]): IHttpClient & { getCallCount(): number } {
  let callCount = 0

  return {
    async post<T>() {
      const response = responses[callCount] ?? responses[responses.length - 1]
      callCount++
      return response as T
    },

    getCallCount() {
      return callCount
    },
  }
}
