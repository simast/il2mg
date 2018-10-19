declare module 'lex' {

	export default class Lexer {
		addRule(pattern: RegExp, action: (lexeme: string, ...matches: string[]) => void): Lexer
		setInput(content: string): Lexer
		lex(): void
	}
}
