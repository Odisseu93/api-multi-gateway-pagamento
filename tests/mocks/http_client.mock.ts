import { type HttpClient } from '#infrastructure/http/client/contracts/http.client'

export function httpClientMock(responses: unknown[]): HttpClient & { getCallCount(): number } {
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
