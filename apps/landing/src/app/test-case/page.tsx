import 'katex/dist/katex.min.css'

import { Box, Grid, Text, VStack } from '@devup-ui/react'
import { readFile } from 'fs/promises'
import { Metadata } from 'next'
import Latex from 'react-latex-next'

import TestCaseCircle from '@/components/test-case/TestCaseCircle'

export const metadata: Metadata = {
  alternates: {
    canonical: '/test-case',
  },
}

export default async function TestCasePage() {
  const [testStatus, ruleMap] = await Promise.all([
    readFile('../../test_status.json', 'utf-8').then((data) =>
      JSON.parse(data),
    ) as Promise<
      Record<
        string,
        [
          success: number,
          fail: number,
          Array<
            [text: string, expected: string, actual: string, isSuccess: boolean]
          >,
        ]
      >
    >,
    readFile('../../rule_map.json', 'utf-8').then((data) =>
      JSON.parse(data),
    ) as Promise<Record<string, { title: string; description: string }>>,
  ])

  return (
    <Box maxW="1920px" mx="auto" pb="100px" w="100%">
      <VStack
        gap="20px"
        px={['16px', null, null, '60px']}
        py={['30px', null, null, '40px']}
      >
        <Text color="$title" typography="title">
          테스트 케이스
        </Text>
        <Text color="$text" typography="body">
          모든 테스트 케이스는{' '}
          <Text
            _hover={{
              textDecoration: 'underline',
            }}
            as="a"
            color="$link"
            href="/2024 개정 한국 점자 규정.pdf"
            target="_blank"
          >
            2024 개정 한국 점자 규정
          </Text>
          을 기반으로 작성되었습니다.
        </Text>
      </VStack>
      {Object.entries(ruleMap).map(([key, value]) => {
        return (
          <VStack
            key={key}
            flex="1"
            gap={['30px', null, null, '40px']}
            px={['16px', null, null, '60px']}
            py={['30px', null, null, '40px']}
          >
            <VStack gap="20px">
              <Text color="$title" typography="docsTitle">
                {value.title} ({testStatus[key][0]}/
                {testStatus[key][1] + testStatus[key][0]})
              </Text>
              <Text color="$text" typography="body">
                {value.description}
              </Text>
            </VStack>
            <Box bg="$text" h="1px" />
            <Grid
              gap="8px"
              gridTemplateColumns="repeat(auto-fill, minmax(16px, 1fr))"
            >
              {testStatus[key][2].map(
                ([text, expected, actual, isSuccess], idx) => {
                  const textParts = parseTextWithLaTeX(text)

                  return (
                    <TestCaseCircle key={text + idx} isSuccess={isSuccess}>
                      <Text
                        color="#FFF"
                        typography="body"
                        whiteSpace="nowrap"
                        wordBreak="keep-all"
                      >
                        {textParts.map((part, partIdx) =>
                          part.type === 'latex' ? (
                            <Latex key={partIdx}>${part.content}$</Latex>
                          ) : (
                            <span key={partIdx}>{part.content}</span>
                          ),
                        )}
                        <br />
                        정답 : {expected}
                        <br />
                        결과 : {actual}
                        <br />
                        {isSuccess ? '✅ 테스트 성공' : '❌ 테스트 실패'}
                      </Text>
                    </TestCaseCircle>
                  )
                },
              )}
            </Grid>
          </VStack>
        )
      })}
    </Box>
  )
}

/**
 * This function parses text with LaTeX expressions and returns an array of parts.
 * It assumes that LaTeX is wrapped in double dollar delimiters ($$...$$).
 * Note that single dollar delimiters ($...$) are not rendered.
 * @param input - The input text to parse.
 * @returns An array of parts, where each part is either a text or a LaTeX expression.
 */
const parseTextWithLaTeX = (input: string) => {
  const parts: Array<{
    type: 'text' | 'latex'
    content: string
  }> = []
  const latexRegex = /\$\$([^$]+(?:\$(?!\$)[^$]*)*)\$\$/g
  let lastIndex = 0
  let match

  while ((match = latexRegex.exec(input)) !== null) {
    // if there is text before the LaTeX expression, add it as a text part:
    if (match.index > lastIndex) {
      const textContent = input.slice(lastIndex, match.index)
      if (textContent) {
        parts.push({ type: 'text', content: textContent })
      }
    }

    // add the LaTeX expression from double dollars:
    const latexContent = match[1]
    parts.push({ type: 'latex', content: latexContent })
    lastIndex = match.index + match[0].length
  }

  // add remaining text after the last LaTeX expression:
  if (lastIndex < input.length) {
    const remainingText = input.slice(lastIndex)
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText })
    }
  }

  // if no LaTeX found, return the original text as a single text part:
  if (!parts.length) {
    parts.push({ type: 'text', content: input })
  }

  return parts
}
