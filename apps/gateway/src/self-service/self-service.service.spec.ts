import { of } from 'rxjs';

const { SelfServiceGatewayService } = require('./self-service.service');

describe('SelfServiceGatewayService routing', () => {
  let selfClient: any;
  let logger: any;
  let service: any;

  beforeEach(() => {
    selfClient = { send: jest.fn().mockReturnValue(of({ ok: true })) };
    logger = { warn: jest.fn(), error: jest.fn() };
    service = new SelfServiceGatewayService(selfClient, logger);
  });

  it('routes listed mobile APIs to self-service using stable mobile patterns', async () => {
    await service.getMyCheckInOut(123);
    await service.getMyWorkLocation(123);
    await service.getLastTransactions(123);
    await service.verifyAssignedLocation(123, {
      coordinates: [25.2048, 55.2708],
    });
    await service.verifyLocation({ coordinates: [25.2048, 55.2708] });
    await service.getSparkTodayLocation(123);
    await service.verifyEncounter({ employeeId: 123, body: {}, file: {} });

    expect(selfClient.send).toHaveBeenCalledWith(
      'mobile_service.transactions.my_check_in_out',
      { employeeId: 123 },
    );
    expect(selfClient.send).toHaveBeenCalledWith(
      'mobile_service.location.my_work_location',
      { employeeId: 123 },
    );
    expect(selfClient.send).toHaveBeenCalledWith(
      'mobile_service.transactions.last_transactions',
      { employeeId: 123 },
    );
    expect(selfClient.send).toHaveBeenCalledWith(
      'mobile_service.location.verify_assigned_location',
      { employeeId: 123, coordinates: [25.2048, 55.2708] },
    );
    expect(selfClient.send).toHaveBeenCalledWith(
      'mobile_service.location.verify_location',
      { coordinates: [25.2048, 55.2708] },
    );
    expect(selfClient.send).toHaveBeenCalledWith(
      'mobile_service.org.spark.today_location',
      { employeeId: 123 },
    );
    expect(selfClient.send).toHaveBeenCalledWith(
      'mobile_service.ids.verify_encounter',
      { employeeId: 123, body: {}, file: {} },
    );
  });

  it('keeps IDS punch on self-service', async () => {
    const payload = { employeeId: 123, body: {}, file: {} };

    await service.punch(payload);

    expect(selfClient.send).toHaveBeenCalledWith('self_service.ids.punch', payload);
  });
});
