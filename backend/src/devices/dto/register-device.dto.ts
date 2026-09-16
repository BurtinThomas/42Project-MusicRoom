import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({
    description:
      'Stable UUID generated once by the client and persisted locally',
  })
  @IsString()
  installationId!: string;

  @ApiProperty({ enum: ['ANDROID', 'IOS', 'WEB'] })
  @IsIn(['ANDROID', 'IOS', 'WEB'])
  platform!: 'ANDROID' | 'IOS' | 'WEB';

  @ApiProperty({ example: 'iPhone 6G' })
  @IsString()
  model!: string;

  @ApiProperty({ example: '1.0.0' })
  @IsString()
  appVersion!: string;
}
