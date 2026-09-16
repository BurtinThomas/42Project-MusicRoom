import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsOptional } from 'class-validator';

export class VoteDto {
  @ApiPropertyOptional({
    description: 'Required when the event license is LOCATION_TIME',
  })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Required when the event license is LOCATION_TIME',
  })
  @IsOptional()
  @IsLongitude()
  lng?: number;
}
