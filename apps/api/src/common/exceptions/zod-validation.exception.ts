/**
 * Converso VPN - Zod Validation Exception
 */

import { BadRequestException } from '@nestjs/common';

export class ZodValidationException extends BadRequestException {
  constructor(message: string) {
    super(message, 'Validation Error');
  }
}