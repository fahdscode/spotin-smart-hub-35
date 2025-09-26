import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MetricCard from "@/components/MetricCard";

interface FinancialData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  type: "fixed" | "variable";
}

const FinanceReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  const financialData: FinancialData[] = [
    { period: "Jan 2024", revenue: 45000, expenses: 32000, profit: 13000, margin: 28.9 },
    { period: "Dec 2023", revenue: 52000, expenses: 35000, profit: 17000, margin: 32.7 },
    { period: "Nov 2023", revenue: 48000, expenses: 33000, profit: 15000, margin: 31.3 },
    { period: "Oct 2023", revenue: 44000, expenses: 31000, profit: 13000, margin: 29.5 }
  ];

  const expenseItems: ExpenseItem[] = [
    {
      id: "EXP-001",
      category: "Utilities",
      description: "Electricity & Water",
      amount: 2500,
      date: "2024-01-15",
      type: "fixed"
    },
    {
      id: "EXP-002", 
      category: "Staff",
      description: "Salaries & Benefits",
      amount: 18000,
      date: "2024-01-01",
      type: "fixed"
    },
    {
      id: "EXP-003",
      category: "Supplies",
      description: "Office & Coffee Supplies",
      amount: 3200,
      date: "2024-01-10",
      type: "variable"
    },
    {
      id: "EXP-004",
      category: "Maintenance",
      description: "Equipment Servicing",
      amount: 800,
      date: "2024-01-12",
      type: "variable"
    },
    {
      id: "EXP-005",
      category: "Marketing",
      description: "Digital Advertising",
      amount: 1500,
      date: "2024-01-08",
      type: "variable"
    }
  ];

  const currentData = financialData[0];
  const previousData = financialData[1];
  
  const revenueChange = ((currentData.revenue - previousData.revenue) / previousData.revenue * 100);
  const expenseChange = ((currentData.expenses - previousData.expenses) / previousData.expenses * 100);
  const profitChange = ((currentData.profit - previousData.profit) / previousData.profit * 100);

  const totalExpenses = expenseItems.reduce((sum, expense) => sum + expense.amount, 0);
  const fixedExpenses = expenseItems.filter(exp => exp.type === "fixed").reduce((sum, exp) => sum + exp.amount, 0);
  const variableExpenses = expenseItems.filter(exp => exp.type === "variable").reduce((sum, exp) => sum + exp.amount, 0);

  const getExpenseTypeColor = (type: ExpenseItem["type"]) => {
    return type === "fixed" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-orange-100 text-orange-800 border-orange-200";
  };

  return (
    <div className="space-y-6">
      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Revenue"
          value={`${currentData.revenue.toLocaleString()} EGP`}
          change={`${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%`}
          icon={DollarSign}
          variant="success"
        />
        <MetricCard
          title="Monthly Expenses"
          value={`${currentData.expenses.toLocaleString()} EGP`}
          change={`${expenseChange > 0 ? '+' : ''}${expenseChange.toFixed(1)}%`}
          icon={TrendingDown}
          variant="warning"
        />
        <MetricCard
          title="Net Profit"
          value={`${currentData.profit.toLocaleString()} EGP`}
          change={`${profitChange > 0 ? '+' : ''}${profitChange.toFixed(1)}%`}
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Profit Margin"
          value={`${currentData.margin}%`}
          icon={PieChart}
          variant="info"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
          <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Monthly Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData.slice(0, 4).map((data, index) => (
                    <div key={data.period} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{data.period}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">€{data.revenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          Profit: €{data.profit.toLocaleString()} ({data.margin}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium">Fixed Expenses</div>
                      <div className="text-sm text-muted-foreground">Recurring monthly costs</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">€{fixedExpenses.toLocaleString()}</div>
                      <div className="text-xs text-blue-500">
                        {((fixedExpenses / totalExpenses) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <div className="font-medium">Variable Expenses</div>
                      <div className="text-sm text-muted-foreground">Fluctuating costs</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-600">€{variableExpenses.toLocaleString()}</div>
                      <div className="text-xs text-orange-500">
                        {((variableExpenses / totalExpenses) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  Detailed Expenses
                </div>
                <Button variant="professional">
                  Export Expenses
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenseItems.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium">{expense.description}</span>
                        <Badge className={getExpenseTypeColor(expense.type)}>
                          {expense.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {expense.category} • {expense.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">€{expense.amount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{expense.id}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData.map((data, index) => {
                  const isPositive = index === 0 || data.revenue > financialData[index - 1]?.revenue;
                  return (
                    <div key={data.period} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {isPositive ? (
                          <TrendingUp className="h-5 w-5 text-success" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-destructive" />
                        )}
                        <div>
                          <div className="font-medium">{data.period}</div>
                          <div className="text-sm text-muted-foreground">Margin: {data.margin}%</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">€{data.revenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          Profit: €{data.profit.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceReports;