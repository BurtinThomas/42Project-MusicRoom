import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

export class SetEventBeaconDto {
  @ApiProperty({ description: 'iBeacon proximity UUID' })
  @IsString()
  uuid!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  major!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minor!: number;
}

export class ScanBeaconDto extends SetEventBeaconDto {}
