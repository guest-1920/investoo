export enum WalletTransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum WalletTransactionSource {
  RECHARGE = 'RECHARGE',
  PURCHASE = 'PURCHASE',
  WITHDRAW = 'WITHDRAW',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  DAILY_RETURN = 'DAILY_RETURN',
  PRINCIPAL_RETURN = 'PRINCIPAL_RETURN',
  REWARD = 'REWARD', // Plan/Window reward claims
}

export enum WalletTransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}
