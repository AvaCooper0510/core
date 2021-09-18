import {
  AlgoliaSearchOptionsDto,
  BackupOptionsDto,
  BaiduSearchOptionsDto,
  CommentOptionsDto,
  MailOptionsDto,
  SeoDto,
  UrlDto,
} from './configs.dto'

export interface IConfig {
  seo: SeoDto
  url: UrlDto
  mailOptions: MailOptionsDto
  commentOptions: CommentOptionsDto
  backupOptions: BackupOptionsDto
  baiduSearchOptions: BaiduSearchOptionsDto
  algoliaSearchOptions: AlgoliaSearchOptionsDto
}

export type IConfigKeys = keyof IConfig
