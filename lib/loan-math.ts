import type { Loan, Repayment } from "@prisma/client";

export function totalDue(loan: Pick<Loan, "amount" | "interestRate" | "latePenaltyAmount" | "extraInterestRate">) {
  const amount = Number(loan.amount);
  return amount + amount * (Number(loan.interestRate) / 100) + amount * (Number(loan.extraInterestRate) / 100) + Number(loan.latePenaltyAmount);
}

export function paidTotal(repayments: Pick<Repayment, "amountPaid">[]) {
  return repayments.reduce((sum, item) => sum + Number(item.amountPaid), 0);
}

export function balanceFor(loan: Pick<Loan, "amount" | "interestRate" | "latePenaltyAmount" | "extraInterestRate"> & { repayments: Pick<Repayment, "amountPaid">[] }) {
  return Math.max(0, totalDue(loan) - paidTotal(loan.repayments));
}
