import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'S3cur3-Passw0rd' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(1)
  displayName!: string;
}
