import { IsIn, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * The access token arrives here once, over HTTPS, and is written straight to
 * oauth_connections with the service-role client. It is never logged, never echoed back in a
 * response, and never stored anywhere else.
 */
export class ConnectMetaChannelDto {
  @IsIn(['instagram', 'facebook']) provider!: 'instagram' | 'facebook';

  @IsString() @MinLength(1) @MaxLength(80) displayName!: string;

  /** Instagram professional account id, or Facebook Page id. Used as the Graph API node id. */
  @IsString() @MinLength(1) @MaxLength(120) externalAccountId!: string;

  @IsString() @MinLength(20) accessToken!: string;

  /** Long-lived Meta tokens expire (~60 days); the transport refuses to send past this. */
  @IsISO8601() accessExpiresAt!: string;

  @IsOptional() @IsString() @MaxLength(400) scopes?: string;
}
