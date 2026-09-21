import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({
    description:
      'Stable UUID generated once by the client and persisted locally',
  })
  @IsString()
  installationId!: string;

  @ApiProperty({ enum: ['ANDROID', 'WEB'] })
  @IsIn(['ANDROID', 'WEB'])
  platform!: 'ANDROID' | 'WEB';

  @ApiProperty({ example: 'Samsung Galaxy S24' })
  @IsString()
  model!: string;

  @ApiProperty({ example: '1.0.0' })
  @IsString()
  appVersion!: string;
}
