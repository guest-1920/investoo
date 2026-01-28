import {
  Controller,
  Get,
  Req,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationDto } from '../common/dto';
import { Request } from 'express';
import { Role } from '../common/enums/roles.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: Role;
  };
}

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * GET /wallet/balance
   * Get my current balance and available balance
   */
  @Get('balance')
  async getMyBalance(@Req() req: AuthenticatedRequest) {
    const [balance, availableBalance] = await Promise.all([
      this.walletService.getBalance(req.user.id),
      this.walletService.getAvailableBalance(req.user.id),
    ]);

    return {
      balance,
      availableBalance,
      pendingWithdrawals: balance - availableBalance,
    };
  }

  /**
   * GET /wallet/transactions
   * Get my wallet transaction ledger with pagination
   */
  @Get('transactions')
  async getMyTransactions(
    @Req() req: AuthenticatedRequest,
    @Query() pagination: PaginationDto,
  ) {
    return this.walletService.getLedger(req.user.id, pagination);
  }

  /**
   * GET /wallet/all
   * ADMIN: Get all transactions with filters
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('all')
  async getAllTransactions(@Query() pagination: PaginationDto) {
    return this.walletService.findAll(pagination);
  }

  /**
   * GET /wallet/transactions/:userId
   * ADMIN: Get any user's wallet transaction ledger
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('transactions/:userId')
  async getUserTransactions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.walletService.getLedger(userId, pagination);
  }

  /**
   * GET /wallet/balance/:userId
   * ADMIN: Get any user's balance
   */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('balance/:userId')
  async getUserBalance(@Param('userId', ParseUUIDPipe) userId: string) {
    const [balance, availableBalance] = await Promise.all([
      this.walletService.getBalance(userId),
      this.walletService.getAvailableBalance(userId),
    ]);

    return {
      userId,
      balance,
      availableBalance,
      pendingWithdrawals: balance - availableBalance,
    };
  }
}
