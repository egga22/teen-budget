export type IncomeType = 'allowance' | 'chore' | 'job' | 'gift';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  incomeType?: IncomeType; // for incomes
  recurring?: boolean; // for recurring income/expense
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
}

export interface Profile {
  id: string;
  name: string;
  balance: number;
  categories: string[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: Record<string, number>; // category -> budget
}
