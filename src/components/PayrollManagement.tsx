import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { Plus, Edit, Trash2, DollarSign, Calendar, Users, CreditCard, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

interface PayrollEmployee {
  id: string;
  employee_name: string;
  employee_id: string | null;
  position: string;
  department: string | null;
  base_salary: number;
  bonuses: number | null;
  deductions: number | null;
  net_salary: number;
  payment_frequency: string;
  bank_account: string | null;
  tax_id: string | null;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  notes: string | null;
}

interface PayrollTransaction {
  id: string;
  payroll_id: string;
  transaction_date: string;
  period_start: string;
  period_end: string;
  base_amount: number;
  bonuses: number | null;
  deductions: number | null;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  paid_at: string | null;
  notes: string | null;
  payroll: PayrollEmployee;
}

const PayrollManagement = () => {
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [transactions, setTransactions] = useState<PayrollTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showProcessPayroll, setShowProcessPayroll] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null);
  
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_id: '',
    position: '',
    department: '',
    base_salary: '',
    bonuses: '',
    deductions: '',
    payment_frequency: 'monthly',
    bank_account: '',
    tax_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const [payrollFormData, setPayrollFormData] = useState({
    payroll_id: '',
    period_start: format(new Date(), 'yyyy-MM-01'),
    period_end: format(new Date(), 'yyyy-MM-dd'),
    base_amount: '',
    bonuses: '',
    deductions: '',
    payment_method: 'bank_transfer',
    notes: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchTransactions();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payroll')
      .select('*')
      .order('employee_name');

    if (error) {
      toast.error('Failed to fetch employees');
      console.error(error);
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('payroll_transactions')
      .select('*, payroll(*)')
      .order('transaction_date', { ascending: false });

    if (error) {
      toast.error('Failed to fetch payroll transactions');
      console.error(error);
    } else {
      setTransactions(data || []);
    }
  };

  const handleAddEmployee = async () => {
    const { error } = await supabase
      .from('payroll')
      .insert([{
        employee_name: formData.employee_name,
        employee_id: formData.employee_id || null,
        position: formData.position,
        department: formData.department || null,
        base_salary: parseFloat(formData.base_salary),
        bonuses: formData.bonuses ? parseFloat(formData.bonuses) : null,
        deductions: formData.deductions ? parseFloat(formData.deductions) : null,
        payment_frequency: formData.payment_frequency,
        bank_account: formData.bank_account || null,
        tax_id: formData.tax_id || null,
        start_date: formData.start_date,
        notes: formData.notes || null
      }]);

    if (error) {
      toast.error('Failed to add employee');
      console.error(error);
    } else {
      toast.success('Employee added successfully');
      setShowAddEmployee(false);
      resetForm();
      fetchEmployees();
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    const { error } = await supabase
      .from('payroll')
      .update({
        employee_name: formData.employee_name,
        employee_id: formData.employee_id || null,
        position: formData.position,
        department: formData.department || null,
        base_salary: parseFloat(formData.base_salary),
        bonuses: formData.bonuses ? parseFloat(formData.bonuses) : null,
        deductions: formData.deductions ? parseFloat(formData.deductions) : null,
        payment_frequency: formData.payment_frequency,
        bank_account: formData.bank_account || null,
        tax_id: formData.tax_id || null,
        start_date: formData.start_date,
        notes: formData.notes || null
      })
      .eq('id', selectedEmployee.id);

    if (error) {
      toast.error('Failed to update employee');
      console.error(error);
    } else {
      toast.success('Employee updated successfully');
      setShowEditEmployee(false);
      setSelectedEmployee(null);
      resetForm();
      fetchEmployees();
    }
  };

  const handleDeactivateEmployee = async (id: string) => {
    const { error } = await supabase
      .from('payroll')
      .update({ is_active: false, end_date: format(new Date(), 'yyyy-MM-dd') })
      .eq('id', id);

    if (error) {
      toast.error('Failed to deactivate employee');
    } else {
      toast.success('Employee deactivated');
      fetchEmployees();
    }
  };

  const handleProcessPayroll = async () => {
    const totalAmount = 
      parseFloat(payrollFormData.base_amount) + 
      (payrollFormData.bonuses ? parseFloat(payrollFormData.bonuses) : 0) - 
      (payrollFormData.deductions ? parseFloat(payrollFormData.deductions) : 0);

    const { error } = await supabase
      .from('payroll_transactions')
      .insert([{
        payroll_id: payrollFormData.payroll_id,
        period_start: payrollFormData.period_start,
        period_end: payrollFormData.period_end,
        base_amount: parseFloat(payrollFormData.base_amount),
        bonuses: payrollFormData.bonuses ? parseFloat(payrollFormData.bonuses) : null,
        deductions: payrollFormData.deductions ? parseFloat(payrollFormData.deductions) : null,
        total_amount: totalAmount,
        payment_method: payrollFormData.payment_method,
        payment_status: 'pending',
        notes: payrollFormData.notes || null
      }]);

    if (error) {
      toast.error('Failed to process payroll');
      console.error(error);
    } else {
      toast.success('Payroll processed successfully');
      setShowProcessPayroll(false);
      resetPayrollForm();
      fetchTransactions();
    }
  };

  const handleMarkAsPaid = async (transactionId: string) => {
    const { error } = await supabase
      .from('payroll_transactions')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (error) {
      toast.error('Failed to update payment status');
    } else {
      toast.success('Marked as paid');
      fetchTransactions();
    }
  };

  const resetForm = () => {
    setFormData({
      employee_name: '',
      employee_id: '',
      position: '',
      department: '',
      base_salary: '',
      bonuses: '',
      deductions: '',
      payment_frequency: 'monthly',
      bank_account: '',
      tax_id: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      notes: ''
    });
  };

  const resetPayrollForm = () => {
    setPayrollFormData({
      payroll_id: '',
      period_start: format(new Date(), 'yyyy-MM-01'),
      period_end: format(new Date(), 'yyyy-MM-dd'),
      base_amount: '',
      bonuses: '',
      deductions: '',
      payment_method: 'bank_transfer',
      notes: ''
    });
  };

  const openEditDialog = (employee: PayrollEmployee) => {
    setSelectedEmployee(employee);
    setFormData({
      employee_name: employee.employee_name,
      employee_id: employee.employee_id || '',
      position: employee.position,
      department: employee.department || '',
      base_salary: employee.base_salary.toString(),
      bonuses: employee.bonuses?.toString() || '',
      deductions: employee.deductions?.toString() || '',
      payment_frequency: employee.payment_frequency,
      bank_account: employee.bank_account || '',
      tax_id: employee.tax_id || '',
      start_date: employee.start_date,
      notes: employee.notes || ''
    });
    setShowEditEmployee(true);
  };

  const exportPayrollReport = () => {
    let csvContent = 'Payroll Report\n\n';
    csvContent += 'Employee Name,Employee ID,Position,Department,Base Salary,Bonuses,Deductions,Net Salary,Payment Frequency,Status,Start Date\n';
    
    employees.forEach(emp => {
      csvContent += `"${emp.employee_name}","${emp.employee_id || ''}","${emp.position}","${emp.department || ''}",${emp.base_salary},${emp.bonuses || 0},${emp.deductions || 0},${emp.net_salary},"${emp.payment_frequency}","${emp.is_active ? 'Active' : 'Inactive'}","${format(new Date(emp.start_date), 'MMM dd, yyyy')}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Payroll_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Report exported successfully');
  };

  const totalMonthlyPayroll = employees
    .filter(e => e.is_active)
    .reduce((sum, e) => sum + Number(e.net_salary), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payroll Management</h2>
          <p className="text-muted-foreground">Manage employee salaries and payroll processing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportPayrollReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => setShowAddEmployee(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(e => e.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyPayroll)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.filter(t => t.payment_status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                transactions
                  .filter(t => t.payment_status === 'paid' && new Date(t.transaction_date).getMonth() === new Date().getMonth())
                  .reduce((sum, t) => sum + Number(t.total_amount), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="transactions">Payroll Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee List</CardTitle>
              <CardDescription>Manage employee payroll information</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employee_name}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department || '-'}</TableCell>
                      <TableCell>{formatCurrency(Number(employee.base_salary))}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(Number(employee.net_salary))}</TableCell>
                      <TableCell>{employee.payment_frequency}</TableCell>
                      <TableCell>
                        <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {employee.is_active && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setPayrollFormData({
                                    ...payrollFormData,
                                    payroll_id: employee.id,
                                    base_amount: employee.base_salary.toString(),
                                    bonuses: employee.bonuses?.toString() || '',
                                    deductions: employee.deductions?.toString() || ''
                                  });
                                  setShowProcessPayroll(true);
                                }}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeactivateEmployee(employee.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payroll Transactions</CardTitle>
                <CardDescription>Track all payroll payments</CardDescription>
              </div>
              <Button onClick={() => setShowProcessPayroll(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Process Payroll
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Bonuses</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-medium">{txn.payroll.employee_name}</TableCell>
                      <TableCell>
                        {format(new Date(txn.period_start), 'MMM dd')} - {format(new Date(txn.period_end), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(txn.base_amount))}</TableCell>
                      <TableCell>{formatCurrency(Number(txn.bonuses || 0))}</TableCell>
                      <TableCell>{formatCurrency(Number(txn.deductions || 0))}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(Number(txn.total_amount))}</TableCell>
                      <TableCell>{txn.payment_method.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Badge variant={txn.payment_status === 'paid' ? 'default' : 'secondary'}>
                          {txn.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {txn.payment_status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsPaid(txn.id)}
                          >
                            Mark as Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Employee Dialog */}
      <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Enter employee payroll information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employee Name *</Label>
              <Input
                value={formData.employee_name}
                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Employee ID</Label>
              <Input
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              />
            </div>
            <div>
              <Label>Position *</Label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div>
              <Label>Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div>
              <Label>Base Salary (EGP) *</Label>
              <Input
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
              />
            </div>
            <div>
              <Label>Payment Frequency *</Label>
              <Select value={formData.payment_frequency} onValueChange={(value) => setFormData({ ...formData, payment_frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bonuses (EGP)</Label>
              <Input
                type="number"
                value={formData.bonuses}
                onChange={(e) => setFormData({ ...formData, bonuses: e.target.value })}
              />
            </div>
            <div>
              <Label>Deductions (EGP)</Label>
              <Input
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
              />
            </div>
            <div>
              <Label>Bank Account</Label>
              <Input
                value={formData.bank_account}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
              />
            </div>
            <div>
              <Label>Tax ID</Label>
              <Input
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            </div>
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEmployee(false)}>Cancel</Button>
            <Button onClick={handleAddEmployee}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditEmployee} onOpenChange={setShowEditEmployee}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee payroll information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employee Name *</Label>
              <Input
                value={formData.employee_name}
                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Employee ID</Label>
              <Input
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              />
            </div>
            <div>
              <Label>Position *</Label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div>
              <Label>Department</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div>
              <Label>Base Salary (EGP) *</Label>
              <Input
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
              />
            </div>
            <div>
              <Label>Payment Frequency *</Label>
              <Select value={formData.payment_frequency} onValueChange={(value) => setFormData({ ...formData, payment_frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bonuses (EGP)</Label>
              <Input
                type="number"
                value={formData.bonuses}
                onChange={(e) => setFormData({ ...formData, bonuses: e.target.value })}
              />
            </div>
            <div>
              <Label>Deductions (EGP)</Label>
              <Input
                type="number"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
              />
            </div>
            <div>
              <Label>Bank Account</Label>
              <Input
                value={formData.bank_account}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
              />
            </div>
            <div>
              <Label>Tax ID</Label>
              <Input
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            </div>
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEmployee(false)}>Cancel</Button>
            <Button onClick={handleEditEmployee}>Update Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payroll Dialog */}
      <Dialog open={showProcessPayroll} onOpenChange={setShowProcessPayroll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payroll</DialogTitle>
            <DialogDescription>Record a payroll payment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee *</Label>
              <Select value={payrollFormData.payroll_id} onValueChange={(value) => {
                const employee = employees.find(e => e.id === value);
                setPayrollFormData({
                  ...payrollFormData,
                  payroll_id: value,
                  base_amount: employee?.base_salary.toString() || '',
                  bonuses: employee?.bonuses?.toString() || '',
                  deductions: employee?.deductions?.toString() || ''
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.is_active).map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.employee_name} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Period Start *</Label>
                <Input
                  type="date"
                  value={payrollFormData.period_start}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, period_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Period End *</Label>
                <Input
                  type="date"
                  value={payrollFormData.period_end}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, period_end: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Base Amount (EGP) *</Label>
                <Input
                  type="number"
                  value={payrollFormData.base_amount}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, base_amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Bonuses (EGP)</Label>
                <Input
                  type="number"
                  value={payrollFormData.bonuses}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, bonuses: e.target.value })}
                />
              </div>
              <div>
                <Label>Deductions (EGP)</Label>
                <Input
                  type="number"
                  value={payrollFormData.deductions}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, deductions: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Payment Method *</Label>
              <Select value={payrollFormData.payment_method} onValueChange={(value) => setPayrollFormData({ ...payrollFormData, payment_method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={payrollFormData.notes}
                onChange={(e) => setPayrollFormData({ ...payrollFormData, notes: e.target.value })}
              />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-xl font-bold">
                  {formatCurrency(
                    (parseFloat(payrollFormData.base_amount) || 0) + 
                    (parseFloat(payrollFormData.bonuses) || 0) - 
                    (parseFloat(payrollFormData.deductions) || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessPayroll(false)}>Cancel</Button>
            <Button onClick={handleProcessPayroll}>Process Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollManagement;
