declare module '@cookshack/codemirror-lang-csv' {
  import { LRLanguage, LanguageSupport } from '@codemirror/language'

  export const csvLanguage: LRLanguage
  export function csv(): LanguageSupport
}
