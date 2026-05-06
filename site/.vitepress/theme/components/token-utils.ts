export interface Token {
  name: string
  value: string
}

export function parseTokens(css: string): Token[] {
  const tokens: Token[] = []
  const pattern = /--([a-zA-Z0-9_-]+):\s*([^;]+);/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(css)) !== null) {
    tokens.push({
      name: match[1],
      value: match[2].trim().replace(/\s+/g, " "),
    })
  }

  return tokens
}

export function byPrefix(tokens: Token[], prefix: string): Token[] {
  return tokens.filter((token) => token.name.startsWith(prefix))
}
