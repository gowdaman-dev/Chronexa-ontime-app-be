import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IdsPunchDto, VerifyLocationDto } from '@app/dto';

describe('self-service DTOs', () => {
  it('accepts a two-number coordinate tuple', async () => {
    const dto = plainToInstance(VerifyLocationDto, {
      coordinates: [25.2048, 55.2708],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid coordinate tuples', async () => {
    const dto = plainToInstance(VerifyLocationDto, {
      coordinates: [25.2048],
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it('requires reason and geolocation for IDS punch payloads', async () => {
    const dto = plainToInstance(IdsPunchDto, {
      reason: 'IN',
      geolocation: '25.2048,55.2708',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
