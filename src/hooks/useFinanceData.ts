import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

export interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  type: "fixed" | "variable";
}

export const useFinanceData = () => {
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch revenue data from receipts
      const { data: receipts, error: receiptsError } = await supabase
        .from('receipts')
        .select('total_amount, receipt_date')
        .order('receipt_date', { ascending: false });

      if (receiptsError) throw receiptsError;

      // Fetch expense data from bills
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select(`
          amount,
          due_date,
          bill_line_items (
            id,
            stock (name, category)
          )
        `)
        .eq('status', 'paid')
        .order('due_date', { ascending: false });

      if (billsError) throw billsError;

      // Group receipts by month for revenue
      const revenueByMonth = receipts?.reduce((acc, receipt) => {
        const month = new Date(receipt.receipt_date).toLocaleString('default', { 
          month: 'short', 
          year: 'numeric' 
        });
        acc[month] = (acc[month] || 0) + Number(receipt.total_amount);
        return acc;
      }, {} as Record<string, number>) || {};

      // Group bills by month for expenses
      const expensesByMonth = bills?.reduce((acc, bill) => {
        const month = new Date(bill.due_date).toLocaleString('default', { 
          month: 'short', 
          year: 'numeric' 
        });
        acc[month] = (acc[month] || 0) + Number(bill.amount);
        return acc;
      }, {} as Record<string, number>) || {};

      // Create financial data array
      const months = Array.from(new Set([
        ...Object.keys(revenueByMonth),
        ...Object.keys(expensesByMonth)
      ])).sort().reverse().slice(0, 6);

      const financialDataArray: FinancialData[] = months.map(month => {
        const revenue = revenueByMonth[month] || 0;
        const expenses = expensesByMonth[month] || 0;
        const profit = revenue - expenses;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          period: month,
          revenue,
          expenses,
          profit,
          margin: Number(margin.toFixed(1))
        };
      });

      setFinancialData(financialDataArray);

      // Transform bills into expense items
      const expenseItemsArray: ExpenseItem[] = bills?.map(bill => ({
        id: bill.bill_line_items?.[0]?.id || 'unknown',
        category: bill.bill_line_items?.[0]?.stock?.category || 'General',
        description: bill.bill_line_items?.[0]?.stock?.name || 'Expense',
        amount: Number(bill.amount),
        date: bill.due_date,
        type: ['rent', 'utilities', 'salaries'].some(keyword => 
          bill.bill_line_items?.[0]?.stock?.name?.toLowerCase().includes(keyword)
        ) ? 'fixed' : 'variable'
      })) || [];

      setExpenseItems(expenseItemsArray);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  return {
    financialData,
    expenseItems,
    loading,
    error,
    refetch: fetchFinancialData
  };
};