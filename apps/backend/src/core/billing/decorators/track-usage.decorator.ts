import { SetMetadata } from '@nestjs/common';

export const TRACK_USAGE_KEY = 'track_usage';
export const TrackUsage = (entityClass: Function) => SetMetadata(TRACK_USAGE_KEY, entityClass);
