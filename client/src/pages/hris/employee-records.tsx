import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  Search,
  ChevronDown,
  User,
  FileText,
  Mail,
  Phone,
  MapPin,
  Briefcase,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Employee, insertEmployeeSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

export default function EmployeeRecords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Fetch employees
  const {
    data: employees,
    isLoading,
  } = useQuery<Employee[]>({
    queryKey: ["/api/hris/employees"],
  });

  // Filter employees by department and search query
  const filteredEmployees = employees
    ? employees
        .filter((employee) => selectedDepartment === "all" || employee.department === selectedDepartment)
        .filter(
          (employee) =>
            !searchQuery ||
            employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.position.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : [];

  // Get unique departments for filter
  const departments = employees
    ? Array.from(new Set(employees.map((employee) => employee.department)))
    : [];

  // Employee Creation Form
  const employeeForm = useForm<z.infer<typeof insertEmployeeSchema>>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      employeeId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      birthDate: new Date() ,
      gender: "male",
      address: "",
      contactNumber: "",
      email: "",
      department: "",
      position: "",
      salary: "0",
      dateHired: new Date() ,
      status: "active",
      createdBy: user?.id || 0,
    },
  });

  // Mutation for creating a new employee
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertEmployeeSchema>) => {
      const res = await apiRequest("POST", "/api/hris/employee", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Employee Created",
        description: "The employee record has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hris/employees"] });
      employeeForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create employee: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle employee form submission
  const onSubmitEmployee = (data: z.infer<typeof insertEmployeeSchema>) => {
    // Format the dates properly
    const formattedData = {
      ...data,
      birthDate: new Date(data.birthDate).toISOString(),
      dateHired: new Date(data.dateHired).toISOString(),
    };
    createEmployeeMutation.mutate(formattedData);
  };

  // Handle view employee details
  const handleViewEmployee = (employee: Employee) => {
    setViewingEmployee(employee);
  };

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Employee Records</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-1" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <Form {...employeeForm}>
                <form onSubmit={employeeForm.handleSubmit(onSubmitEmployee)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={employeeForm.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter employee ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={employeeForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              {...field}
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={employeeForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={employeeForm.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter middle name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={employeeForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={employeeForm.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birth Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value }
                              // onChange={(e) => {
                              //   field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '');
                              // }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={employeeForm.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={employeeForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={employeeForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={employeeForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter department" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={employeeForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter position" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={employeeForm.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary (₱)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Enter salary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={employeeForm.control}
                      name="dateHired"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Hired</FormLabel>
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
                      disabled={createEmployeeMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {createEmployeeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Add Employee
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search employees..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="rounded-md border border-neutral-300 h-10 text-sm px-3 py-2 bg-white w-full sm:w-auto min-w-[180px]"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filteredEmployees || filteredEmployees.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <User className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">No employees found</p>
              <p className="text-neutral-400 text-sm mt-1">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : selectedDepartment !== "all"
                  ? `No employees in "${selectedDepartment}" department`
                  : "Add an employee to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-primary h-16 flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-white text-primary border-4 border-white flex items-center justify-center text-2xl font-bold mt-8">
                      {employee.firstName.charAt(0)}
                      {employee.lastName.charAt(0)}
                    </div>
                  </div>
                  <div className="pt-12 px-4 pb-4 text-center">
                    <h3 className="font-semibold text-lg">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-neutral-500">{employee.position}</p>
                    <p className="text-xs text-neutral-400 mt-1">ID: {employee.employeeId}</p>

                    <div className="flex flex-col gap-2 mt-4 text-sm">
                      <div className="flex items-center gap-2 justify-center">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <span>{employee.department}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="truncate max-w-[200px]">{employee.email}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{employee.contactNumber}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewEmployee(employee)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Employee Details Modal */}
        {viewingEmployee && (
          <Dialog open={!!viewingEmployee} onOpenChange={(open) => !open && setViewingEmployee(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Employee Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="h-24 w-24 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold">
                    {viewingEmployee.firstName.charAt(0)}
                    {viewingEmployee.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {viewingEmployee.firstName} {viewingEmployee.middleName ? viewingEmployee.middleName + " " : ""}
                      {viewingEmployee.lastName}
                    </h3>
                    <p className="text-neutral-500">{viewingEmployee.position}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          viewingEmployee.status === "active"
                            ? "bg-green-100 text-emerald-800"
                            : viewingEmployee.status === "on_leave"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {viewingEmployee.status.charAt(0).toUpperCase() +
                          viewingEmployee.status.slice(1).replace("_", " ")}
                      </span>
                      <span className="text-xs text-neutral-400">
                        ID: {viewingEmployee.employeeId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-200 pt-4">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500">Personal Information</h4>
                    <ul className="mt-2 space-y-2">
                      <li className="flex gap-2 text-sm">
                        <span className="text-neutral-500 w-24">Birth Date:</span>
                        <span>{new Date(viewingEmployee.birthDate).toLocaleDateString()}</span>
                      </li>
                      <li className="flex gap-2 text-sm">
                        <span className="text-neutral-500 w-24">Gender:</span>
                        <span>
                          {viewingEmployee.gender.charAt(0).toUpperCase() + viewingEmployee.gender.slice(1)}
                        </span>
                      </li>
                      <li className="flex gap-2 text-sm">
                        <span className="text-neutral-500 w-24">Address:</span>
                        <span>{viewingEmployee.address}</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-neutral-500">Contact Information</h4>
                    <ul className="mt-2 space-y-2">
                      <li className="flex gap-2 text-sm">
                        <span className="text-neutral-500 w-24">Email:</span>
                        <span>{viewingEmployee.email}</span>
                      </li>
                      <li className="flex gap-2 text-sm">
                        <span className="text-neutral-500 w-24">Phone:</span>
                        <span>{viewingEmployee.contactNumber}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <h4 className="text-sm font-medium text-neutral-500">Employment Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <ul className="space-y-2">
                      <li className="flex gap-2 text-sm">
                        <span className="text-neutral-500 w-24">Department:</span>
                        <span>{viewingEmployee.department}</span>
                      </li>
                      <li className="flex gap-2 text-sm">
                        <span className="text-neutral-500 w-24">Position:</span>
                        <span>{viewingEmployee.position}</span>
                      </li>
                    </ul>
                    <ul className="space-y-2">
                      <li className="flex gap-2 text-sm">
                        <span className="text-neutral-500 w-24">Date Hired:</span>
                        <span>{new Date(viewingEmployee.dateHired).toLocaleDateString()}</span>
                      </li>
                      <li className="flex gap-2 text-sm">
                        <span className="text-neutral-500 w-24">Salary:</span>
                        <span>₱{Number(viewingEmployee.salary).toLocaleString()}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewingEmployee(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
