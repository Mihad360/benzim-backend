export interface IEarning {
  orderId: string;

  saleAmount: number;

  customerEndCommissionRate: number;
  customerEndCommissionAmount: number;

  cookEndCommissionRate: number;
  cookEndCommissionAmount: number;

  commissionAmount: number;

  date: Date;

  status: "pending" | "completed" | "failed";
}
