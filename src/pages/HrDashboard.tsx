import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, UserCheck, TrendingUp } from "lucide-react";
import PayrollManagement from "@/components/PayrollManagement";
import EmployeeRecords from "@/components/EmployeeRecords";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function HrDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    monthlyPayroll: 0,
    averageSalary: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: payrollData } = await supabase
        .from('payroll')
        .select('base_salary, is_active');

      if (payrollData) {
        const active = payrollData.filter(p => p.is_active);
        const totalPayroll = active.reduce((sum, p) => sum + Number(p.base_salary), 0);
        
        setStats({
          totalEmployees: payrollData.length,
          activeEmployees: active.length,
          monthlyPayroll: totalPayroll,
          averageSalary: active.length > 0 ? totalPayroll / active.length : 0
        });
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">HR Management Portal</h1>
          <p className="text-muted-foreground">Manage employees, payroll, and HR operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeEmployees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.monthlyPayroll.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageSalary.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payroll" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payroll">Payroll Management</TabsTrigger>
            <TabsTrigger value="employees">Employee Records</TabsTrigger>
          </TabsList>

          <TabsContent value="payroll">
            <PayrollManagement />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeRecords />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
