import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  Search,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Employee, Payroll as PayrollType, PayrollItem, insertPayrollSchema, insertPayrollItemSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

export default function Payroll() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayroll, setSelectedPayroll] = useState<number | null>(null);
  
  // Fetch payrolls
  const {
    data: payrolls,
    isLoading: isLoadingPayrolls,
  } = useQuery<PayrollType[]>({
    queryKey: ["/api/hris/payrolls"],
  });

  // Fetch employees (for adding to payroll)
  const {
    data: employees,
    isLoading: isLoadingEmployees,
  } = useQuery<Employee[]>({
    queryKey: ["/api/hris/employees?status=active"],
  });

  // Fetch payroll items for selected payroll
  const {
    data: payrollItems,
    isLoading: isLoadingPayrollItems,
  } = useQuery<PayrollItem[]>({
    queryKey: [`/api/hris/payroll/${selectedPayroll}/items`],
    enabled: !!selectedPayroll,
  });

  // Filter payrolls by search query
  const filteredPayrolls = payrolls
    ? payrolls.filter(
        (payroll) =>
          !searchQuery ||
          payroll.payrollPeriod.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payroll.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Form for creating a new payroll
  const payrollForm = useForm<z.infer<typeof insertPayrollSchema>>({
    resolver: zodResolver(insertPayrollSchema),
    defaultValues: {
      payrollPeriod: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
      description: "",
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
      status: "draft",
      createdBy: user?.id || 0,
    },
  });

  // Form for adding an employee to payroll
  const payrollItemForm = useForm<z.infer<typeof insertPayrollItemSchema>>({
    resolver: zodResolver(insertPayrollItemSchema),
    defaultValues: {
      payrollId: selectedPayroll || 0,
      employeeId: 0,
      basicPay: "0",
      overtime: "0",
      allowances: "0",
      deductions: "0",
      netPay: "0",
    },
  });

  // Update payroll item form when selected payroll changes
  React.useEffect(() => {
    if (selectedPayroll) {
      payrollItemForm.setValue("payrollId", selectedPayroll);
    }
  }, [selectedPayroll, payrollItemForm]);

  // Mutation for creating a new payroll
  const createPayrollMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertPayrollSchema>) => {
      const res = await apiRequest("POST", "/api/hris/payroll", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payroll Created",
        description: "The payroll has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hris/payrolls"] });
      setSelectedPayroll(data.id);
      payrollForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create payroll: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for adding an employee to payroll
  const addPayrollItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertPayrollItemSchema>) => {
      const res = await apiRequest("POST", "/api/hris/payroll-item", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Employee Added",
        description: "The employee has been added to the payroll successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/hris/payroll/${selectedPayroll}/items`] });
      payrollItemForm.reset({
        payrollId: selectedPayroll || 0,
        employeeId: 0,
        basicPay: "0",
        overtime: "0",
        allowances: "0",
        deductions: "0",
        netPay: "0",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add employee to payroll: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle payroll form submission
  const onSubmitPayroll = (data: z.infer<typeof insertPayrollSchema>) => {
    // Format the dates properly
    const formattedData = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    };
    createPayrollMutation.mutate(formattedData);
  };

  // Handle payroll item form submission
  const onSubmitPayrollItem = (data: z.infer<typeof insertPayrollItemSchema>) => {
    // Calculate net pay
    const basicPay = parseFloat(data.basicPay) || 0;
    const overtime = parseFloat(data.overtime) || 0;
    const allowances = parseFloat(data.allowances) || 0;
    const deductions = parseFloat(data.deductions) || 0;
    const netPay = (basicPay + overtime + allowances - deductions).toString();

    addPayrollItemMutation.mutate({
      ...data,
      netPay,
    });
  };

  // Handle net pay calculation when form values change
  const calculateNetPay = () => {
    const basicPay = parseFloat(payrollItemForm.watch("basicPay")) || 0;
    const overtime = parseFloat(payrollItemForm.watch("overtime")) || 0;
    const allowances = parseFloat(payrollItemForm.watch("allowances")) || 0;
    const deductions = parseFloat(payrollItemForm.watch("deductions")) || 0;
    const netPay = (basicPay + overtime + allowances - deductions).toString();
    payrollItemForm.setValue("netPay", netPay);
  };

  // Calculate total payroll amount
  const calculateTotalPayroll = () => {
    if (!payrollItems || payrollItems.length === 0) return 0;
    return payrollItems.reduce((total, item) => total + parseFloat(item.netPay), 0);
  };

  // Finalize payroll mutation
  const finalizePayrollMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/hris/payroll/${id}`, {
        status: "finalized",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payroll Finalized",
        description: "The payroll has been finalized successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hris/payrolls"] });
      queryClient.invalidateQueries({ queryKey: [`/api/hris/payroll/${selectedPayroll}/items`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to finalize payroll: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Get selected payroll
  const selectedPayrollData = selectedPayroll && payrolls 
    ? payrolls.find(p => p.id === selectedPayroll)
    : null;

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Payroll Management</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-1" />
                New Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Payroll</DialogTitle>
              </DialogHeader>
              <Form {...payrollForm}>
                <form onSubmit={payrollForm.handleSubmit(onSubmitPayroll)} className="space-y-4">
                  <FormField
                    control={payrollForm.control}
                    name="payrollPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payroll Period</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter payroll period (e.g. January 2025)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={payrollForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={payrollForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '');
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={payrollForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '');
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={createPayrollMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {createPayrollMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Payroll
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search payrolls..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Payroll List */}
          <div className="col-span-1 md:col-span-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">Payroll Periods</h3>

                {isLoadingPayrolls ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !filteredPayrolls || filteredPayrolls.length === 0 ? (
                  <div className="p-4 text-center border border-dashed rounded-md">
                    <Calendar className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-neutral-500">No payrolls found</p>
                    <p className="text-neutral-400 text-sm mt-1">Create a new payroll to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPayrolls.map((payroll) => (
                      <div
                        key={payroll.id}
                        className={`p-3 rounded-md cursor-pointer border ${
                          selectedPayroll === payroll.id
                            ? "border-primary bg-blue-50"
                            : "border-neutral-200 hover:border-primary"
                        }`}
                        onClick={() => setSelectedPayroll(payroll.id)}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{payroll.payrollPeriod}</h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              payroll.status === "finalized"
                                ? "bg-green-100 text-emerald-800"
                                : payroll.status === "draft"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-blue-100 text-primary"
                            }`}
                          >
                            {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">{payroll.description}</p>
                        <div className="flex justify-between text-xs text-neutral-400 mt-2">
                          <span>{new Date(payroll.startDate).toLocaleDateString()} - {new Date(payroll.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payroll Details */}
          <div className="col-span-1 md:col-span-8">
            {!selectedPayroll ? (
              <div className="bg-white rounded-lg shadow-sm border border-dashed p-8 flex flex-col items-center justify-center h-full">
                <FileText className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-600 mb-2">No Payroll Selected</h3>
                <p className="text-neutral-500 text-center mb-4">
                  Select a payroll from the list or create a new one
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white">
                      <Plus className="h-4 w-4 mr-1" />
                      Create New Payroll
                    </Button>
                  </DialogTrigger>
                  {/* Dialog content is the same as above */}
                </Dialog>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{selectedPayrollData?.payrollPeriod}</h3>
                      <p className="text-sm text-neutral-500">
                        {selectedPayrollData?.description}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {selectedPayrollData?.startDate && selectedPayrollData?.endDate && 
                          `${new Date(selectedPayrollData.startDate).toLocaleDateString()} - ${new Date(selectedPayrollData.endDate).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {selectedPayrollData?.status === "draft" && (
                        <Button
                          variant="outline"
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => finalizePayrollMutation.mutate(selectedPayroll)}
                          disabled={!payrollItems || payrollItems.length === 0 || finalizePayrollMutation.isPending}
                        >
                          {finalizePayrollMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Finalize Payroll
                        </Button>
                      )}

                      {selectedPayrollData?.status === "draft" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-white">
                              <Plus className="h-4 w-4 mr-1" />
                              Add Employee
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Add Employee to Payroll</DialogTitle>
                            </DialogHeader>
                            <Form {...payrollItemForm}>
                              <form onSubmit={payrollItemForm.handleSubmit(onSubmitPayrollItem)} className="space-y-4">
                                <FormField
                                  control={payrollItemForm.control}
                                  name="employeeId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Employee</FormLabel>
                                      <FormControl>
                                        <select
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                          {...field}
                                          value={field.value || ""}
                                          onChange={(e) => {
                                            const value = Number(e.target.value);
                                            field.onChange(value);
                                            
                                            // Prefill basic pay from employee salary
                                            const employee = employees?.find(emp => emp.id === value);
                                            if (employee) {
                                              payrollItemForm.setValue("basicPay", employee.salary);
                                              calculateNetPay();
                                            }
                                          }}
                                        >
                                          <option value="">Select an employee</option>
                                          {isLoadingEmployees ? (
                                            <option disabled>Loading employees...</option>
                                          ) : employees && employees.length > 0 ? (
                                            employees.map((employee) => (
                                              <option key={employee.id} value={employee.id}>
                                                {employee.firstName} {employee.lastName} - {employee.position}
                                              </option>
                                            ))
                                          ) : (
                                            <option disabled>No active employees available</option>
                                          )}
                                        </select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <FormField
                                    control={payrollItemForm.control}
                                    name="basicPay"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Basic Pay (₱)</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Enter basic pay"
                                            {...field}
                                            onChange={(e) => {
                                              field.onChange(e);
                                              calculateNetPay();
                                            }}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={payrollItemForm.control}
                                    name="overtime"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Overtime (₱)</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Enter overtime pay"
                                            {...field}
                                            onChange={(e) => {
                                              field.onChange(e);
                                              calculateNetPay();
                                            }}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <FormField
                                    control={payrollItemForm.control}
                                    name="allowances"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Allowances (₱)</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Enter allowances"
                                            {...field}
                                            onChange={(e) => {
                                              field.onChange(e);
                                              calculateNetPay();
                                            }}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={payrollItemForm.control}
                                    name="deductions"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Deductions (₱)</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Enter deductions"
                                            {...field}
                                            onChange={(e) => {
                                              field.onChange(e);
                                              calculateNetPay();
                                            }}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={payrollItemForm.control}
                                  name="netPay"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Net Pay (₱)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          placeholder="Net pay is calculated automatically"
                                          {...field}
                                          readOnly
                                          className="bg-gray-50"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline" type="button">
                                      Cancel
                                    </Button>
                                  </DialogClose>
                                  <Button
                                    type="submit"
                                    disabled={addPayrollItemMutation.isPending}
                                    className="bg-primary hover:bg-primary/90 text-white"
                                  >
                                    {addPayrollItemMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Add to Payroll
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>

                  {isLoadingPayrollItems ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !payrollItems || payrollItems.length === 0 ? (
                    <div className="p-8 text-center">
                      <DollarSign className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                      <p className="text-neutral-500">No employees in this payroll</p>
                      <p className="text-neutral-400 text-sm mt-1">
                        {selectedPayrollData?.status === "draft"
                          ? "Add employees to this payroll"
                          : "This payroll has been finalized with no employees"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-neutral-50 text-left">
                              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Employee ID
                              </th>
                              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Employee Name
                              </th>
                              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Basic Pay
                              </th>
                              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Overtime
                              </th>
                              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Allowances
                              </th>
                              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Deductions
                              </th>
                              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                Net Pay
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {payrollItems.map((item) => {
                              const employee = employees?.find(emp => emp.id === item.employeeId);
                              return (
                                <tr key={item.id}>
                                  <td className="px-4 py-3 text-sm font-medium text-neutral-600">
                                    {employee?.employeeId || `ID: ${item.employeeId}`}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-neutral-500">
                                    {employee ? `${employee.firstName} ${employee.lastName}` : `Employee ${item.employeeId}`}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-neutral-500">
                                    ₱{Number(item.basicPay).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-neutral-500">
                                    ₱{Number(item.overtime).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-neutral-500">
                                    ₱{Number(item.allowances).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-neutral-500">
                                    ₱{Number(item.deductions).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-neutral-600">
                                    ₱{Number(item.netPay).toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="p-4 border-t border-neutral-200 bg-neutral-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium text-neutral-500">Total Employees:</span>
                            <span className="text-sm text-neutral-600 ml-2">{payrollItems.length}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-neutral-500">Total Payroll Amount:</span>
                            <span className="text-sm font-bold text-neutral-700 ml-2">
                              ₱{calculateTotalPayroll().toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}