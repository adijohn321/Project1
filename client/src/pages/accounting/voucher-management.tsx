import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  Check,
  AlertCircle,
  Search,
  ChevronDown,
  Receipt,
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { JournalEntry, Voucher, insertVoucherSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

export default function VoucherManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<number | null>(null);

  // Fetch posted journal entries (for creating vouchers)
  const {
    data: postedJournalEntries,
    isLoading: isLoadingJournalEntries,
  } = useQuery<JournalEntry[]>({
    queryKey: ["/api/accounting/journal-entries?status=posted"],
  });

  // Fetch vouchers
  const {
    data: vouchers,
    isLoading: isLoadingVouchers,
  } = useQuery<Voucher[]>({
    queryKey: ["/api/accounting/vouchers"],
  });

  // Filter vouchers by status and search query
  const filteredVouchers = vouchers
    ? vouchers
      .filter((voucher) => selectedStatus === "all" || voucher.status === selectedStatus)
      .filter(
        (voucher) =>
          !searchQuery ||
          voucher.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          voucher.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
          voucher.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Form for creating a new voucher
  const voucherForm = useForm<z.infer<typeof insertVoucherSchema>>({
    resolver: zodResolver(insertVoucherSchema),
    defaultValues: {
      journalEntryId: selectedJournalEntry || 0,
      voucherNumber: "",
      payee: "",
      description: "",
      amount: "0",
      voucherDate: new Date().toISOString(),
      status: "draft",
      createdBy: user?.id || 0,
    },
  });

  // Update form values when selected journal entry changes
  React.useEffect(() => {
    if (selectedJournalEntry) {
      voucherForm.setValue("journalEntryId", selectedJournalEntry);

      // Get journal entry details to prefill description and amount
      const journalEntry = postedJournalEntries?.find(je => je.id === selectedJournalEntry);
      if (journalEntry) {
        voucherForm.setValue("description", `Voucher for ${journalEntry.entryNumber}`);
        // We'd need to calculate the amount, but since we don't have access to the journal entry items,
        // we'll leave it at 0 for now.
      }
    }
  }, [selectedJournalEntry, postedJournalEntries, voucherForm]);

  // Mutation for creating a new voucher
  const createVoucherMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertVoucherSchema>) => {
      const res = await apiRequest("POST", "/api/accounting/voucher", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Voucher Created",
        description: "The voucher has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/vouchers"] });
      voucherForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create voucher: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for approving a voucher
  const approveVoucherMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/accounting/voucher/${id}`, {
        status: "approved",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Voucher Approved",
        description: "The voucher has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/vouchers"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve voucher: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle voucher form submission
  const onSubmitVoucher = (data: z.infer<typeof insertVoucherSchema>) => {
    // Format the date properly
    const formattedData = {
      ...data,
      voucherDate: new Date(data.voucherDate).toISOString(),
    };
    createVoucherMutation.mutate(formattedData);
  };

  // Status filter options
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "draft", label: "Draft" },
    { value: "approved", label: "Approved" },
    { value: "paid", label: "Paid" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Voucher Management</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-1" />
                New Voucher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Voucher</DialogTitle>
              </DialogHeader>
              <Form {...voucherForm}>
                <form onSubmit={voucherForm.handleSubmit(onSubmitVoucher)} className="space-y-4">
                  <FormField
                    control={voucherForm.control}
                    name="voucherNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voucher Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter voucher number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={voucherForm.control}
                    name="journalEntryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Journal Entry</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              field.onChange(value);
                              setSelectedJournalEntry(value);
                            }}
                          >
                            <option value="">Select a journal entry</option>
                            {isLoadingJournalEntries ? (
                              <option disabled>Loading journal entries...</option>
                            ) : postedJournalEntries && postedJournalEntries.length > 0 ? (
                              postedJournalEntries.map((entry) => (
                                <option key={entry.id} value={entry.id}>
                                  {entry.entryNumber} - {new Date(entry.entryDate).toLocaleDateString()}
                                </option>
                              ))
                            ) : (
                              <option disabled>No posted journal entries available</option>
                            )}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={voucherForm.control}
                    name="payee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payee</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter payee name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={voucherForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={voucherForm.control}
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={voucherForm.control}
                    name="voucherDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voucher Date</FormLabel>
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

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={createVoucherMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {createVoucherMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Voucher
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
              placeholder="Search vouchers..."
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

        {/* Voucher List */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="font-medium text-neutral-600">Vouchers</h3>
            </div>

            {isLoadingVouchers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredVouchers || filteredVouchers.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">No vouchers found</p>
                <p className="text-neutral-400 text-sm mt-1">
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : selectedStatus !== "all"
                      ? `No vouchers with status "${selectedStatus}"`
                      : "Create a new voucher to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-neutral-50 text-left">
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Voucher #
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Payee
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Description
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
                    {filteredVouchers.map((voucher) => (
                      <tr key={voucher.id}>
                        <td className="px-4 py-3 text-sm font-medium text-neutral-600">
                          {voucher.voucherNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">{voucher.payee}</td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          <div className="max-w-xs truncate">{voucher.description}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          ₱{Number(voucher.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          {new Date(voucher.voucherDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${voucher.status === "approved"
                                ? "bg-green-100 text-emerald-800"
                                : voucher.status === "paid"
                                  ? "bg-blue-100 text-primary"
                                  : voucher.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
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
                              {voucher.status === "draft" && (
                                <DropdownMenuItem onClick={() => approveVoucherMutation.mutate(voucher.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
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
