import type { HttpContext } from '@adonisjs/core/http'
import fs from 'node:fs/promises'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'

export default class DocsController {
  public async index({ response }: HttpContext) {
    const html = `<!doctype html>
<html>
  <head>
    <title>API de Pagamentos Multi-Gateway - Documentação</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; }
    </style>
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.yaml"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`
    return response.header('Content-Type', 'text/html').send(html)
  }

  public async getSpec({ response }: HttpContext) {
    // In production (Docker), app.makePath refers to the build/ directory
    // docs/ will be inside build/ because of metaFiles in adonisrc.ts
    const specPath = app.makePath('docs', 'openapi.yaml')

    try {
      console.log('[DocsController] Searching for spec at:', specPath)
      const content = await fs.readFile(specPath, 'utf8')
      return response.header('Content-Type', 'text/yaml').send(content)
    } catch (err: any) {
      console.error('[DocsController] Error reading spec at:', specPath, err.message)

      try {
        const fallbackPath = join(app.appRoot.pathname, 'docs', 'openapi.yaml')
        const normalizedPath =
          fallbackPath.startsWith('/') && fallbackPath.includes(':')
            ? fallbackPath.substring(1)
            : fallbackPath

        console.log('[DocsController] Trying fallback path:', normalizedPath)
        const content = await fs.readFile(normalizedPath, 'utf8')
        return response.header('Content-Type', 'text/yaml').send(content)
      } catch (fallbackErr: any) {
        console.error('[DocsController] Fallback also failed:', fallbackErr.message)
        return response.status(404).send('Specification file not found')
      }
    }
  }
}
