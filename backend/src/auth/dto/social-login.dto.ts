import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'ID token returned by the Google Sign-In SDK on the device',
  })
  @IsString()
  idToken!: string;
}

export class FacebookLoginDto {
  @ApiProperty({
    description:
      'Access token returned by the Facebook Login SDK on the device',
  })
  @IsString()
  accessToken!: string;
}
