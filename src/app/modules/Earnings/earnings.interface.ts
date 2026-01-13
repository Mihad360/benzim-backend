export interface IEarning {
  orderId: string;
  orderNo: string;
  // What customer paid
  totalPaidByCustomer: number;

  // What cook receives (after admin cut)
  cookEarnings: number;
  cookEarningsRate: number; // e.g., 0.93 (93%)

  // What admin earns (platform fee)
  adminEarn: number;
  adminEarnRate: number; // e.g., 0.07 (7%)

  date: Date;
  status: "pending" | "completed" | "failed";
  isDeleted: boolean;
}
