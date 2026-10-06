/* eslint-disable @typescript-eslint/unbound-method */
import { EScoreHistorySuccess } from '../../../common/enum/score-story/score-history-success.enum';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { IResponse } from '../../../common/interfaces/response.interface';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { ScoreHistoryEntity } from '../entity/score-history.entity';
import { IScoreHistoryService } from '../interfaces/score-history.service.interface';
import { ScoreHistoryController } from '../score-history.controller';
import { IJwtPayloadWithExpiry } from '../../../modules/auth/interfaces/jwt-payload.interface';
import { EPermission } from '../../../common/enum/role/permissions.enum';
import { User } from '../../users/entities/user.entity';

describe('ScoreHistoryController', () => {
  let controller: ScoreHistoryController;
  let service: jest.Mocked<IScoreHistoryService>;

  const mockUserPayload: IJwtPayloadWithExpiry = {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '153e4567-e89b-12d3-3556-426614174000',
    username: 'admin.user',
    roles: ['Admin'],
    permissions: [EPermission.SCORE_HISTORY_ADJUST],
    fingerprint: 'mock-fingerprint',
    exp: Date.now() + 3600,
  };

  const dto: ScoreHistoryDto = {
    score: 100,
    description: 'Prova x',
  };

  const unit = {
    unitId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '153e4567-e89b-12d3-3556-426614174000',
  };

  const mockScoreHistory: ScoreHistoryEntity = {
    id: '123e4567-e89b-12d3-a456-426614174111',
    tenantId: '153e4567-e89b-12d3-3556-426614174000',
    unitId: '123e4567-e89b-12d3-a456-426614174000',
    isApproved: false,
    approvedById: null,
    createdById: '123e4567-e89b-12d3-a456-426614174000',
    approvedBy: null,
    createdBy: {} as User,
    score: 150,
    description: 'Bônus por participação em evento',
    createdAt: new Date('2026-09-23T20:00:00.000Z'),
    updatedAt: new Date('2026-09-23T20:00:00.000Z'),
    unit: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      tenantId: 'd3b07384-d113-4ec6-a4f6-53856372d681',
      name: 'Unidade Alpha',
      gender: EUnitGender.MALE,
      maxMembers: 8,
      score: 150,
      scoreHistories: [],
      createdAt: new Date('2026-09-18T22:00:00.000Z'),
      updatedAt: new Date('2026-09-18T22:00:00.000Z'),
    },
  };

  beforeEach(() => {
    service = {
      adjustUnitScore: jest.fn(),
      findAllHistoryScorePending: jest.fn(),
      approveScore: jest.fn(),
      findHistoryByUnitId: jest.fn(),
    };

    controller = new ScoreHistoryController(service);
  });

  describe('adjustUnitScore', () => {
    it('should call service adjustUnitScore successfully', async () => {
      const response: IResponse<{ newScore: number }> = {
        message: EScoreHistorySuccess.FIND,
        data: { newScore: 0 },
      };
      service.adjustUnitScore.mockResolvedValue(response);

      const result = await controller.adjustUnitScore(
        unit.unitId,
        mockUserPayload,
        unit.tenantId,
        dto,
      );

      expect(result).toEqual(response);
      expect(service.adjustUnitScore).toHaveBeenCalledWith(
        unit.unitId,
        mockUserPayload.sub,
        unit.tenantId,
        dto,
      );
    });
  });

  describe('findAllHistoryScorePending', () => {
    it('should return pending list successfully', async () => {
      const response: IResponse<ScoreHistoryEntity[]> = {
        message: EScoreHistorySuccess.FIND,
        data: [mockScoreHistory],
      };
      service.findAllHistoryScorePending.mockResolvedValue(response);

      const result = await controller.findAllHistoryScorePending(unit.tenantId);

      expect(result).toEqual(response);
      expect(service.findAllHistoryScorePending).toHaveBeenCalledWith(
        unit.tenantId,
      );
    });
  });

  describe('approveScore', () => {
    it('should call service approveScore successfully', async () => {
      const response: IResponse<null> = {
        message: EScoreHistorySuccess.APPROVE,
        data: null,
      };
      service.approveScore.mockResolvedValue(response);

      const result = await controller.approveScore(
        mockScoreHistory.id,
        unit.tenantId,
        mockUserPayload,
      );

      expect(result).toEqual(response);
      expect(service.approveScore).toHaveBeenCalledWith(
        mockScoreHistory.id,
        unit.tenantId,
        mockUserPayload,
      );
    });
  });

  describe('findHistoryByUnitId', () => {
    it('should return history list successfully', async () => {
      const listResponse: IResponse<ScoreHistoryEntity[]> = {
        message: EScoreHistorySuccess.FIND,
        data: [mockScoreHistory],
      };

      service.findHistoryByUnitId.mockResolvedValue(listResponse);

      const result = await controller.findHistoryByUnitId(
        unit.unitId,
        unit.tenantId,
      );

      expect(result).toEqual(listResponse);
    });
  });
});
