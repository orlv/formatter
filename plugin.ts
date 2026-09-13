import type { ESLint, Rule, SourceCode } from 'eslint'

function isResultUnused(node: Rule.Node): boolean {
  return (
    node.parent?.type === 'ExpressionStatement' || (node.parent?.type === 'ForStatement' && node.parent.update === node)
  )
}

const preferIncrement: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [],
    messages: {
      increment: 'Use ++ instead of += 1.',
      decrement: 'Use -- instead of -= 1.'
    }
  },

  create(context) {
    const sourceCode = context.sourceCode

    return {
      AssignmentExpression(node) {
        if (
          (node.operator !== '+=' && node.operator !== '-=') ||
          node.right.type !== 'Literal' ||
          node.right.value !== 1
        ) {
          return
        }

        const operator = node.operator === '+=' ? '++' : '--'

        context.report({
          node,
          messageId: node.operator === '+=' ? 'increment' : 'decrement',
          fix(fixer) {
            if (sourceCode.commentsExistBetween(node.left, node.right)) {
              return null
            }

            const operand = sourceCode.getText(node.left)
            return fixer.replaceText(node, isResultUnused(node) ? `${operand}${operator}` : `${operator}${operand}`)
          }
        })
      }
    }
  }
}

function isBlockLike(sourceCode: SourceCode, node: Rule.Node): boolean {
  if (node.type === 'LabeledStatement') {
    return isBlockLike(sourceCode, node.body as Rule.Node)
  }

  if ((node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') && node.declaration) {
    return isBlockLike(sourceCode, node.declaration as Rule.Node)
  }

  switch (node.type) {
    case 'BlockStatement':
    case 'FunctionDeclaration':
    case 'IfStatement':
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'TryStatement':
    case 'SwitchStatement':
      break
    default:
      return false
  }

  if (node.type === 'DoWhileStatement' && node.body.type === 'BlockStatement') {
    return true
  }

  let token = sourceCode.getLastToken(node)

  if (token?.value === ';') {
    token = sourceCode.getTokenBefore(token)
  }

  if (token?.value !== '}') {
    return false
  }

  const block = sourceCode.getNodeByRangeIndex(token.range[0])
  return block?.type === 'BlockStatement' || block?.type === 'SwitchStatement'
}

const paddingAroundBlocks: Rule.RuleModule = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [],
    messages: {
      padding: 'Expected blank line around block.'
    }
  },

  create(context) {
    const sourceCode = context.sourceCode

    function checkStatements(statements: Rule.Node[]): void {
      for (let i = 1; i < statements.length; i++) {
        const previous = statements[i - 1]!
        const next = statements[i]!

        if (!isBlockLike(sourceCode, previous) && !isBlockLike(sourceCode, next)) {
          continue
        }

        const tokens = [
          sourceCode.getLastToken(previous)!,
          ...sourceCode.getTokensBetween(previous, next, { includeComments: true }),
          sourceCode.getFirstToken(next)!
        ]

        if (tokens.some((token, index) => index > 0 && token.loc!.start.line - tokens[index - 1]!.loc!.end.line > 1)) {
          continue
        }

        context.report({
          node: next,
          messageId: 'padding',
          fix(fixer) {
            const lastToken = sourceCode.getLastToken(previous)!
            let end = lastToken.range[1]
            let endLine = lastToken.loc.end.line

            for (const comment of sourceCode.getTokensBetween(previous, next, { includeComments: true })) {
              if (comment.loc!.start.line !== endLine) {
                break
              }

              end = comment.range![1]
              endLine = comment.loc!.end.line
            }

            return fixer.insertTextAfterRange([0, end], endLine === next.loc!.start.line ? '\n\n' : '\n')
          }
        })
      }
    }

    return {
      'Program:exit'(node) {
        checkStatements(node.body as Rule.Node[])
      },
      'BlockStatement:exit'(node) {
        checkStatements(node.body as Rule.Node[])
      },
      'StaticBlock:exit'(node) {
        checkStatements(node.body as Rule.Node[])
      },
      'SwitchCase:exit'(node) {
        checkStatements(node.consequent as Rule.Node[])
      }
    }
  }
}

const plugin: ESLint.Plugin = {
  rules: {
    'prefer-increment': preferIncrement,
    'padding-around-blocks': paddingAroundBlocks
  }
}

export default plugin
