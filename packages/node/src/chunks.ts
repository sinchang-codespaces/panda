import { Stylesheet } from '@pandacss/core'
import { logger } from '@pandacss/logger'
import type { PandaContext } from './context'
import { extractFile } from './extract'

export async function extractChunks(ctx: PandaContext) {
  const sheet = new Stylesheet(ctx.context(), {
    content: [
      '@layer reset, base, tokens, recipes, utilities;',
      "@import './layout-grid.css';",
      ctx.preflight && "@import './reset.css';",
      !ctx.tokens.isEmpty && "@import './tokens/index.css';",
      ctx.theme.keyframes && "@import './tokens/keyframes.css';",
    ]
      .filter(Boolean)
      .join('\n\n'),
  })

  const files = ctx.chunks.getFiles()

  await Promise.all(
    files.map(async (file) => {
      const css = await ctx.chunks.readFile(file)
      sheet.append(css)
    }),
  )

  return sheet.toCss({ minify: ctx.minify })
}

export async function bundleChunks(ctx: PandaContext) {
  const css = await extractChunks(ctx)
  await ctx.write(ctx.paths.root, [{ file: 'styles.css', code: css }])
}

export async function writeFileChunk(ctx: PandaContext, file: string) {
  logger.info('chunk:change', `File changed: ${file}`)
  const result = extractFile(ctx, file)
  if (result) {
    await ctx.chunks.write(result.file, result.css)
  }
}
