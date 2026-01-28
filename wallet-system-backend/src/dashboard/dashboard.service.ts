import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../common/enums/roles.enum';
import { Recharge, RechargeStatus } from '../recharge/recharge.entity';
import {
  Withdrawal,
  WithdrawalStatus,
} from '../withdrawals/withdrawals.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { WalletTransaction } from '../wallet/wallet-transaction.entity';
import {
  WalletTransactionSource,
  WalletTransactionType,
} from '../wallet/enums/wallet.enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Recharge)
    private readonly rechargeRepo: Repository<Recharge>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(WalletTransaction)
    private readonly walletTxRepo: Repository<WalletTransaction>,
  ) {}

  async getSummary() {
    const totalUsers = await this.userRepo.count({
      where: { role: Role.USER },
    });

    const { sum: totalRecharges } = await this.rechargeRepo
      .createQueryBuilder('recharge')
      .select('SUM(recharge.amount)', 'sum')
      .where('recharge.status = :status', { status: RechargeStatus.APPROVED })
      .getRawOne();

    const { sum: totalWithdrawals } = await this.withdrawalRepo
      .createQueryBuilder('withdrawal')
      .select('SUM(withdrawal.amount)', 'sum')
      .where('withdrawal.status = :status', {
        status: WithdrawalStatus.APPROVED,
      })
      .getRawOne();

    const { sum: totalPlanValue, count: totalSubscriptions } =
      await this.subRepo
        .createQueryBuilder('sub')
        .leftJoin('sub.plan', 'plan')
        .select('SUM(plan.price)', 'sum')
        .addSelect('COUNT(sub.id)', 'count')
        .getRawOne();

    const { sum: totalReferralRewards } = await this.walletTxRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'sum')
      .where('tx.source = :source', {
        source: WalletTransactionSource.REFERRAL_BONUS,
      })
      .andWhere('tx.type = :type', { type: WalletTransactionType.CREDIT })
      .getRawOne();

    return {
      totalUsers,
      totalRecharges: Number(totalRecharges) || 0,
      totalWithdrawals: Number(totalWithdrawals) || 0,
      totalPlanValue: Number(totalPlanValue) || 0,
      totalSubscriptions: Number(totalSubscriptions) || 0,
      totalReferralRewards: Number(totalReferralRewards) || 0,
    };
  }

  async getCharts() {
    const days = 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Helper to generate date range
    const dateRange: string[] = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(endDate.getDate() - i);
      dateRange.push(d.toISOString().split('T')[0]);
    }

    // New Users Query
    const newUsersData = await this.userRepo
      .createQueryBuilder('user')
      .select("TO_CHAR(user.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.role = :role', { role: Role.USER })
      .andWhere('user.createdAt >= :startDate', { startDate })
      .groupBy("TO_CHAR(user.createdAt, 'YYYY-MM-DD')")
      .getRawMany();

    // Recharges Query
    const rechargesData = await this.rechargeRepo
      .createQueryBuilder('recharge')
      .select("TO_CHAR(recharge.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(recharge.amount)', 'amount')
      .where('recharge.status = :status', { status: RechargeStatus.APPROVED })
      .andWhere('recharge.createdAt >= :startDate', { startDate })
      .groupBy("TO_CHAR(recharge.createdAt, 'YYYY-MM-DD')")
      .getRawMany();

    // Withdrawals Query
    const withdrawalsData = await this.withdrawalRepo
      .createQueryBuilder('withdrawal')
      .select("TO_CHAR(withdrawal.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(withdrawal.amount)', 'amount')
      .where('withdrawal.status = :status', {
        status: WithdrawalStatus.APPROVED,
      })
      .andWhere('withdrawal.createdAt >= :startDate', { startDate })
      .groupBy("TO_CHAR(withdrawal.createdAt, 'YYYY-MM-DD')")
      .getRawMany();

    // Map to result
    const chartData = dateRange.map((date) => {
      const userEntry = newUsersData.find((d) => d.date === date);
      const rechargeEntry = rechargesData.find((d) => d.date === date);
      const withdrawalEntry = withdrawalsData.find((d) => d.date === date);

      return {
        date,
        newUsers: userEntry ? Number(userEntry.count) : 0,
        recharges: rechargeEntry ? Number(rechargeEntry.amount) : 0,
        withdrawals: withdrawalEntry ? Number(withdrawalEntry.amount) : 0,
      };
    });

    return chartData;
  }
}
