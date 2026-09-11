import { PartialType } from '@nestjs/swagger';
import { LocationDto } from './location.dto';

export class UpdateLocationDto extends PartialType(LocationDto) {}
