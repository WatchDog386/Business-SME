import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  /**
   * How the person signs in: a subscriber's username or account number
   * (e.g. `mary` or `1617`), or a staff member's email.
   */
  @ApiProperty({ example: 'mary' })
  @ValidateIf((o: LoginDto) => !o.email)
  @IsString()
  @IsNotEmpty({ message: 'Enter your username or email.' })
  @MaxLength(320)
  identifier?: string;

  /** Older apps send the same value as `email`. */
  @ApiPropertyOptional({ deprecated: true })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @IsNotEmpty({ message: 'Enter your password.' })
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'newsecret123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Enter your current password.' })
  currentPassword: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters.' })
  newPassword: string;
}
export class TwoFactorTicketDto {
  @ApiProperty({ description: 'Second-step ticket from /auth/login' })
  @IsString()
  @IsNotEmpty()
  mfaToken: string;
}

/** Turning two-factor on from Settings: the first code from the app. */
export class TwoFactorEnableDto {
  @ApiProperty({ example: '123456', description: '6-digit authenticator code' })
  @IsString()
  @IsNotEmpty({ message: 'Enter the code from your authenticator app.' })
  code: string;
}

/** Turning two-factor off from Settings: confirmed with the account password. */
export class TwoFactorDisableDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Enter your password.' })
  password: string;
}

export class TwoFactorCodeDto extends TwoFactorTicketDto {
  @ApiProperty({ example: '123456', description: '6-digit authenticator code or a recovery code' })
  @IsString()
  @IsNotEmpty({ message: 'Enter the code from your authenticator app.' })
  code: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Enter your name.' })
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string;

  /** A photo picked in the app (data URL, up to ~2 MB) or an https link; null removes it. */
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(3_000_000, { message: 'Photo must be smaller than 2 MB.' })
  @Matches(/^(data:image\/(png|jpe?g|webp|gif|avif|bmp|heic|heif);base64,|https:\/\/)/, {
    message: 'Photo must be an image such as JPEG or PNG (not SVG).',
  })
  avatarUrl?: string | null;
}
