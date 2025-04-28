import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  AlertCircle,
  Search,
  ChevronDown,
  CreditCard,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Voucher, Disbursement, insertDisbursementSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

export default function Disbursements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<number | null>(null);

  // Fetch approved vouchers (for creating disbursements)
  const {
    data: approvedVouchers,
    isLoading: isLoadingVouchers,
  } = useQuery<Voucher[]>({
    queryKey: ["/api/accounting/vouchers?status=approved"],
  });

  // Fetch disbursements
  const {
    data: disbursements,
    isLoading: isLoadingDisbursements,
  } = useQuery<Disbursement[]>({
    queryKey: ["/api/treasury/disbursements"],
  });

  // Filter disbursements by status and search query
  const filteredDisbursements = disbursements
    ? disbursements
        .filter((disbursement) => selectedStatus === "all" || disbursement.status === selectedStatus)
        .filter(
          (disbursement) =>
            !searchQuery ||
            disbursement.checkNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            disbursement.bankAccount.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : [];

  // Form for creating a new disbursement
  const disbursementForm = useForm<z.infer<typeof insertDisbursementSchema>>({
    resolver: zodResolver(insertDisbursementSchema),
    defaultValues: {
      voucherId: selectedVoucher || 0,
      checkNumber: "",
      bankAccount: "",
      amount: "0",
      disbursementDate: new Date().toISOString(),
      status: "issued",
      createdBy: user?.id || 0,
    },
  });

  // Update form values when selected voucher changes
  React.useEffect(() => {
    if (selectedVoucher) {
      disbursementForm.setValue("voucherId", selectedVoucher);
      
      // Get voucher details to prefill amount
      const voucher = approvedVouchers?.find(v => v.id === selectedVoucher);
      if (voucher) {
        disbursementForm.setValue("amount", voucher.amount);
      }
    }
  }, [selectedVoucher, approvedVouchers, disbursementForm]);

  // Mutation for creating a new disbursement
  const createDisbursementMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertDisbursementSchema>) => {
      const res = await apiRequest("POST", "/api/treasury/disbursement", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Disbursement Created",
        description: "The disbursement has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/disbursements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/vouchers?status=approved"] });
      disbursementForm.reset({
        voucherId: 0,
        checkNumber: "",
        bankAccount: "",
        amount: "0",
        disbursementDate: new Date().toISOString(),
        status: "issued",
        createdBy: user?.id || 0,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create disbursement: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle disbursement form submission
  const onSubmitDisbursement = (data: z.infer<typeof insertDisbursementSchema>) => {
    // Format the date properly
    const formattedData = {
      ...data,
      disbursementDate: new Date(data.disbursementDate).toISOString(),
    };
    createDisbursementMutation.mutate(formattedData);
  };

  // Status filter options
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "issued", label: "Issued" },
    { value: "cleared", label: "Cleared" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Disbursements</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-1" />
                New Disbursement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Disbursement</DialogTitle>
              </DialogHeader>
              <Form {...disbursementForm}>
                <form onSubmit={disbursementForm.handleSubmit(onSubmitDisbursement)} className="space-y-4">
                  <FormField
                    control={disbursementForm.control}
                    name="voucherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voucher</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              field.onChange(value);
                              setSelectedVoucher(value);
                            }}
                          >
                            <option value="">Select a voucher</option>
                            {isLoadingVouchers ? (
                              <option disabled>Loading vouchers...</option>
                            ) : approvedVouchers && approvedVouchers.length > 0 ? (
                              approvedVouchers.map((voucher) => (
                                <option key={voucher.id} value={voucher.id}>
                                  {voucher.voucherNumber} - {voucher.payee} (₱{Number(voucher.amount).toLocaleString()})
                                </option>
                              ))
                            ) : (
                              <option disabled>No approved vouchers available</option>
                            )}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={disbursementForm.control}
                    name="checkNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter check number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={disbursementForm.control}
                    name="bankAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bank account details" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={disbursementForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₱)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Enter amount"
                              {...field}
                              readOnly={!!selectedVoucher} // Make readonly if a voucher is selected
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={disbursementForm.control}
                      name="disbursementDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disbursement Date</FormLabel>
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
                      disabled={createDisbursementMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {createDisbursementMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Disbursement
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
              placeholder="Search disbursements..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="rounded-md border border-neutral-300 h-10 text-sm px-3 py-2 bg-white w-full sm:w-auto min-w-[150px]"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Disbursement List */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="font-medium text-neutral-600">Disbursements</h3>
            </div>

            {isLoadingDisbursements ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredDisbursements || filteredDisbursements.length === 0 ? (
              <div className="p-8 text-center">
                <CreditCard className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">No disbursements found</p>
                <p className="text-neutral-400 text-sm mt-1">
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : selectedStatus !== "all"
                    ? `No disbursements with status "${selectedStatus}"`
                    : "Create a new disbursement to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-neutral-50 text-left">
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Check #
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Bank Account
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredDisbursements.map((disbursement) => (
                      <tr key={disbursement.id}>
                        <td className="px-4 py-3 text-sm font-medium text-neutral-600">
                          {disbursement.checkNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">{disbursement.bankAccount}</td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          ₱{Number(disbursement.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          {new Date(disbursement.disbursementDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              disbursement.status === "cleared"
                                ? "bg-green-100 text-emerald-800"
                                : disbursement.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-primary"
                            }`}
                          >
                            {disbursement.status.charAt(0).toUpperCase() + disbursement.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {disbursement.status === "issued" && (
                                <DropdownMenuItem>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Mark as Cleared
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
