import { IsIn, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * The LINE channel access token arrives here once, over HTTPS, and is written straight to
 * oauth_connections with the service-role client. It is never logged, never echoed back in a
 * response, and never stored anywhere else.
 *
 * externalAccountId is the LINE user/group/room id the channel will send to. For the
 * individual user message path this is the LINE userId from the webhook payload.
 */
export class ConnectLineChannelDto {
  @IsIn(['line']) provider!: 'line';

  @IsString() @MinLength(1) @MaxLength(80) displayName!: string;

  /**
   * For LINE outbound, this is the LINE userId the message is sent to. For the full
   * channel-to-user path, store the LINE user id that arrives on inbound messages.
   */
  @IsString() @MinLength(1) @MaxLength(120) externalAccountId!: string;

  @IsString() @MinLength(20) accessToken!: string;

  /** LINE channel access tokens expire; the transport refuses to send past this. */
  @IsISO8601() accessExpiresAt!: string;

  @IsOptional() @IsString() @MaxLength(400) scopes?: string;
}
