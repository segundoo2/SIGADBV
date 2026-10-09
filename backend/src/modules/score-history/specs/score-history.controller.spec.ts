/* eslint-disable @typescript-eslint/unbound-method */
import { EScoreHistorySuccess } from '../../../common/enum/score-story/score-history-success.enum';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { EUnitSuccess } from '../../../common/enum/unit/unit-success.enum';
import { IResponse } from '../../../common/interfaces/response.interface';
import { UnitEntity } from '../../units/entities/unit.entity';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { ScoreHistoryEntity } from '../entity/score-history.entity';
import { IScoreHistoryService } from '../interfaces/score-history.service.interface';
import { ScoreHistoryController } from '../score-history.controller';
import { EScoreHistoryStatus } from '../../../common/enum/score-story/score-history-status.enum';
import { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { User } from '../../users/entities/user.entity';

describe('ScoreHistoryController', () => {
  let controller: ScoreHistoryController;
  let service: jest.Mocked<IScoreHistoryService>;

  const dto: ScoreHistoryDto = {
    score: 100,
    description: 'Prova x',
  };

  const tenantId = 'uuid-tenant';
  const currentUser: IJwtPayload = {
    sub: 'user-uuid',
    username: 'user-test',
    fingerprint: 'test',
    tenantId: tenantId,
    roles: [],
    permissions: [],
  };

  const mockScoreHistory: ScoreHistoryEntity = {
    id: '123e4567-e89b-12d3-a456-426614174111',
    tenantId: '153e4567-e89b-12d3-3556-426614174000',
    unitId: '123e4567-e89b-12d3-a456-426614174000',
    score: 150,
    description: 'Bônus por participação em evento',
    status: EScoreHistoryStatus.PENDING,
    requestedById: '123e4567-e89b-12d3-a456-426614174222',
    requestedBy: {
      id: '123e4567-e89b-12d3-a456-426614174222',
      name: 'Utilizador Teste',
    } as unknown as User,
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
      requestAdjustUnitScore: jest.fn(),
      findHistoryByUnitId: jest.fn(),
      findAllUnitsNameAndId: jest.fn(),
      retrivePendingUnitsScore: jest.fn(),
      approveUnitScore: jest.fn(),
      rejectUnitScore: jest.fn(),
    };

    controller = new ScoreHistoryController(service);
  });

  describe('requestAdjustUnitScore', () => {
    it('should request adjust unit score with success', async () => {
      const response: IResponse<null> = {
        message: EScoreHistorySuccess.REQUEST_SCORE,
        data: null,
      };
      service.requestAdjustUnitScore.mockResolvedValue(response);

      const result = await controller.requestAdjustUnitScore(
        mockScoreHistory.unitId,
        currentUser,
        tenantId,
        dto,
      );

      expect(result).toEqual(response);
      expect(service.requestAdjustUnitScore).toHaveBeenCalledWith(
        mockScoreHistory.unitId,
        currentUser.sub,
        tenantId,
        dto,
      );
    });
  });

  describe('findHistoryByUnitId', () => {
    it('should return score history list with success', async () => {
      const response: IResponse<ScoreHistoryEntity[]> = {
        message: EScoreHistorySuccess.FIND,
        data: [mockScoreHistory],
      };
      service.findHistoryByUnitId.mockResolvedValue(response);

      const result = await controller.findHistoryByUnitId(
        mockScoreHistory.unitId,
        tenantId,
      );

      expect(result).toEqual(response);
      expect(service.findHistoryByUnitId).toHaveBeenCalledWith(
        mockScoreHistory.unitId,
        tenantId,
        undefined,
      );
    });
  });

  describe('findAllUnitsNameAndId', () => {
    it('should return units name and id list with success', async () => {
      const unitsResponse: IResponse<Pick<UnitEntity, 'id' | 'name'>[]> = {
        message: EUnitSuccess.FIND,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Unidade Alpha',
          },
        ],
      };
      service.findAllUnitsNameAndId.mockResolvedValue(unitsResponse);

      const result = await controller.findAllUnitsNameAndId(tenantId);

      expect(result).toEqual(unitsResponse);
      expect(service.findAllUnitsNameAndId).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('retrivePendingUnitsScore', () => {
    it('should return pending units score list with success', async () => {
      const response: IResponse<ScoreHistoryEntity[]> = {
        message: EScoreHistorySuccess.RETRIVE_SCORE_HISTORYS,
        data: [mockScoreHistory],
      };
      service.retrivePendingUnitsScore.mockResolvedValue(response);

      const result = await controller.retrivePendingUnitsScore(tenantId);

      expect(result).toEqual(response);
      expect(service.retrivePendingUnitsScore).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('approveUnitScore', () => {
    it('should approve unit score with success', async () => {
      const response: IResponse<null> = {
        message: EUnitSuccess.ADJUST_SCORE,
        data: null,
      };
      service.approveUnitScore.mockResolvedValue(response);

      const result = await controller.approveUnitScore(
        mockScoreHistory.id,
        currentUser,
        tenantId,
      );

      expect(result).toEqual(response);
      expect(service.approveUnitScore).toHaveBeenCalledWith(
        mockScoreHistory.id,
        currentUser.sub,
        tenantId,
      );
    });
  });

  describe('rejectUnitScore', () => {
    it('should reject unit score with success', async () => {
      const response: IResponse<null> = {
        message: EScoreHistorySuccess.REQUEST_SCORE,
        data: null,
      };
      service.rejectUnitScore.mockResolvedValue(response);

      const result = await controller.rejectUnitScore(
        mockScoreHistory.id,
        currentUser,
        tenantId,
      );

      expect(result).toEqual(response);
      expect(service.rejectUnitScore).toHaveBeenCalledWith(
        mockScoreHistory.id,
        currentUser.sub,
        tenantId,
      );
    });
  });
});
