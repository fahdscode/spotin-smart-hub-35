import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit, Eye, Search, UserX } from "lucide-react";

interface Employee {
  id: string;
  employee_id: string | null;
  employee_name: string;
  position: string;
  department: string | null;
  base_salary: number;
  payment_frequency: string;
  bank_account: string | null;
  tax_id: string | null;
  national_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export default function EmployeeRecords() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  
  const [formData, setFormData] = useState({
    employee_name: "",
    position: "",
    department: "",
    base_salary: "",
    payment_frequency: "monthly",
    bank_account: "",
    tax_id: "",
    national_id: "",
    start_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, statusFilter, departmentFilter]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(emp => 
        statusFilter === "active" ? emp.is_active : !emp.is_active
      );
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    setFilteredEmployees(filtered);
  };

  const getDepartments = () => {
    const departments = new Set(employees.map(emp => emp.department).filter(Boolean));
    return Array.from(departments);
  };

  const handleAddEmployee = async () => {
    try {
      const { error } = await supabase.from('payroll').insert({
        employee_name: formData.employee_name,
        position: formData.position,
        department: formData.department || null,
        base_salary: Number(formData.base_salary),
        payment_frequency: formData.payment_frequency,
        bank_account: formData.bank_account || null,
        tax_id: formData.tax_id || null,
        national_id: formData.national_id || null,
        start_date: formData.start_date,
        notes: formData.notes || null,
        is_active: true
      });

      if (error) throw error;

      toast.success('Employee added successfully');
      setShowDialog(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
    }
  };

  const handleEditEmployee = async () => {
    if (!editingEmployee) return;

    try {
      const { error } = await supabase
        .from('payroll')
        .update({
          employee_name: formData.employee_name,
          position: formData.position,
          department: formData.department || null,
          base_salary: Number(formData.base_salary),
          payment_frequency: formData.payment_frequency,
          bank_account: formData.bank_account || null,
          tax_id: formData.tax_id || null,
          national_id: formData.national_id || null,
          start_date: formData.start_date,
          notes: formData.notes || null
        })
        .eq('id', editingEmployee.id);

      if (error) throw error;

      toast.success('Employee updated successfully');
      setShowDialog(false);
      setEditingEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    }
  };

  const handleDeactivateEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] })
        .eq('id', id);

      if (error) throw error;

      toast.success('Employee deactivated');
      fetchEmployees();
    } catch (error) {
      console.error('Error deactivating employee:', error);
      toast.error('Failed to deactivate employee');
    }
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_name: employee.employee_name,
      position: employee.position,
      department: employee.department || "",
      base_salary: employee.base_salary.toString(),
      payment_frequency: employee.payment_frequency,
      bank_account: employee.bank_account || "",
      tax_id: employee.tax_id || "",
      national_id: employee.national_id || "",
      start_date: employee.start_date,
      notes: employee.notes || ""
    });
    setShowDialog(true);
  };

  const openViewDialog = (employee: Employee) => {
    setViewingEmployee(employee);
    setShowViewDialog(true);
  };

  const resetForm = () => {
    setFormData({
      employee_name: "",
      position: "",
      department: "",
      base_salary: "",
      payment_frequency: "monthly",
      bank_account: "",
      tax_id: "",
      national_id: "",
      start_date: new Date().toISOString().split('T')[0],
      notes: ""
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Employee Records</CardTitle>
          <CardDescription>Manage employee information and records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, position, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {getDepartments().map(dept => (
                  <SelectItem key={dept} value={dept as string}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>

          {/* Employee Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No employees found</TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-mono text-sm">{employee.employee_id || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{employee.employee_name}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department || 'N/A'}</TableCell>
                      <TableCell>
                        {employee.base_salary.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.is_active ? "default" : "secondary"}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openViewDialog(employee)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(employee)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {employee.is_active && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeactivateEmployee(employee.id)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) { setEditingEmployee(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? 'Update employee information' : 'Enter employee details'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_name">Full Name *</Label>
                <Input
                  id="employee_name"
                  value={formData.employee_name}
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="national_id">National ID *</Label>
                <Input
                  id="national_id"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  placeholder="14-digit National ID"
                  maxLength={14}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_salary">Base Salary *</Label>
                <Input
                  id="base_salary"
                  type="number"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_frequency">Payment Frequency</Label>
                <Select
                  value={formData.payment_frequency}
                  onValueChange={(value) => setFormData({ ...formData, payment_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account">Bank Account</Label>
                <Input
                  id="bank_account"
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingEmployee(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={editingEmployee ? handleEditEmployee : handleAddEmployee}>
              {editingEmployee ? 'Update' : 'Add'} Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {viewingEmployee && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                  <p className="text-base">{viewingEmployee.employee_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={viewingEmployee.is_active ? "default" : "secondary"}>
                    {viewingEmployee.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-base">{viewingEmployee.employee_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Position</p>
                  <p className="text-base">{viewingEmployee.position}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-base">{viewingEmployee.department || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Base Salary</p>
                  <p className="text-base">
                    {viewingEmployee.base_salary.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Frequency</p>
                  <p className="text-base capitalize">{viewingEmployee.payment_frequency}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">National ID</p>
                  <p className="text-base">{viewingEmployee.national_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tax ID</p>
                  <p className="text-base">{viewingEmployee.tax_id || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bank Account</p>
                  <p className="text-base">{viewingEmployee.bank_account || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-base">{new Date(viewingEmployee.start_date).toLocaleDateString()}</p>
                </div>
              </div>
              {viewingEmployee.end_date && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="text-base">{new Date(viewingEmployee.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              {viewingEmployee.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-base">{viewingEmployee.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
