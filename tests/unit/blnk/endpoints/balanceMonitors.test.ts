/* eslint-disable n/no-unpublished-import */
/* eslint-disable @typescript-eslint/no-floating-promises */
import tap from "tap";
import {BalanceMonitor} from "../../../../src/blnk/endpoints/balanceMonitors";
import {
  createMockBlnkRequest,
  createMockLogger,
} from "../../../mocks/blnkClientMocks";
import {BlnkRequest} from "../../../../src/types/general";
import {FormatResponse} from "../../../../src/blnk/utils/httpClient";
import {MonitorData} from "../../../../src/types/balanceMonitor";

tap.test(`POST BalanceMonitor`, async t => {
  t.test(`Create Balance Monitor`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      true,
      undefined,
      201,
    );

    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const balanceMonitor = new BalanceMonitor(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const id = `1234567890`;
    const data: MonitorData = {
      balance_id: id,
      condition: {
        field: `debit_balance`,
        operator: `<`,
        value: 500,
        precision: 100,
      },
    };
    const response = await balanceMonitor.create(data);
    childTest.equal(response.status, 201);
    childTest.equal(response.data?.balance_id, data.balance_id);
    childTest.match(capturedRequest.args(), [
      [`balance-monitors`, data, `POST`],
    ]);
    childTest.end();
  });
  t.test(`It should handle missing fields`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      true,
      undefined,
      201,
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const balanceMonitor = new BalanceMonitor(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const data: unknown = {
      condition: {
        field: `debit_balance`,
        operator: `<`,
        value: 500,
        precision: 100,
      },
    };
    const response = await balanceMonitor.create(data as MonitorData);
    childTest.equal(response.status, 400);
    childTest.equal(response.data, null);
    childTest.match(capturedRequest.args(), []);
    childTest.end();
  });
  t.test(`It should handle invalid fields`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      true,
      undefined,
      201,
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const balanceMonitor = new BalanceMonitor(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const id = `1234567890`;
    const data: unknown = {
      balance_id: id,
      condition: {
        field: `debit_balance`,
        operator: `<`,
        value: `500`,
        precision: 100,
      },
    };
    const response = await balanceMonitor.create(data as MonitorData);
    childTest.equal(response.status, 400);
    childTest.equal(response.data, null);
    childTest.match(capturedRequest.args(), []);
    childTest.end();
  });
});

tap.test(`GET BalanceMonitor`, async t => {
  t.test(`Get Balance Monitor`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      true,
      undefined,
      200,
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const balanceMonitor = new BalanceMonitor(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const id = `1234567890`;
    const response = await balanceMonitor.get(id);
    childTest.equal(response.status, 200);
    childTest.match(capturedRequest.args(), [
      [`balance-monitors/${id}`, undefined, `GET`],
    ]);
    childTest.end();
  });
  t.test(`List Balance Monitors`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      true,
      undefined,
      200,
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const balanceMonitor = new BalanceMonitor(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const response = await balanceMonitor.list();
    childTest.equal(response.status, 200);
    childTest.match(capturedRequest.args(), [
      [`balance-monitors`, undefined, `GET`],
    ]);
    childTest.end();
  });
});

tap.test(`PUT BalanceMonitor`, async t => {
  t.test(`It should update a balance monitor`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      true,
      undefined,
      200,
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const balanceMonitor = new BalanceMonitor(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const id = `12345678`;
    const data: unknown = {
      balance_id: id,
      condition: {
        field: `debit_balance`,
        operator: `<`,
        value: 500,
        precision: 100,
      },
    };
    const response = await balanceMonitor.update(id, data as MonitorData);
    childTest.equal(response.status, 200);
    childTest.equal(
      response.data?.balance_id,
      (data as MonitorData).balance_id,
    );
    childTest.match(capturedRequest.args(), [
      [`balance-monitors/${id}`, data, `PUT`],
    ]);
    childTest.end();
  });
  t.test(`It should handle missing fields`, async childTest => {
    const mockLogger = createMockLogger();
    const thirdPartyRequest: BlnkRequest = createMockBlnkRequest(
      true,
      undefined,
      201,
    );
    const capturedRequest = childTest.captureFn(thirdPartyRequest);
    const balanceMonitor = new BalanceMonitor(
      capturedRequest,
      mockLogger,
      FormatResponse,
    );
    const id = `1234567890`;
    const data: unknown = {
      condition: {
        field: `debit_balance`,
        operator: `<`,
        value: 500,
        precision: 100,
      },
    };
    const response = await balanceMonitor.update(id, data as MonitorData);
    childTest.equal(response.status, 400);
    childTest.equal(response.data, null);
    childTest.match(capturedRequest.args(), []);
    childTest.end();
  });
});
