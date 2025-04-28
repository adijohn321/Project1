import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Plus,
  AlertCircle,
  ChevronDown,
  FileText,
  DollarSign,
  BookOpen
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
import { 
  BudgetObligation, 
  JournalEntry, 
  JournalEntryItem, 
  insertJournalEntrySchema, 
  insertJournalEntryItemSchema 
} from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

export default function JournalEntries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedObligation, setSelectedObligation] = useState<number | null>(null);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<number | null>(null);
  
  // Fetch pending obligations (for creating journal entries)
  const {
    data: pendingObligations,
    isLoading: isLoadingObligations,
  } = useQuery<BudgetObligation[]>({
    queryKey: ["/api/budget/obligations?status=approved"],
  });

  // Fetch journal entries
  const {
    data: journalEntries,
    isLoading: isLoadingEntries,
  } = useQuery<JournalEntry[]>({
    queryKey: ["/api/accounting/journal-entries"],
  });

  // Fetch selected journal entry details
  const {
    data: selectedEntry,
    isLoading: isLoadingSelectedEntry,
  } = useQuery<{items: JournalEntryItem[]} & JournalEntry>({
    queryKey: [`/api/accounting/journal-entry/${selectedJournalEntry}`],
    enabled: !!selectedJournalEntry,
  });

  // Form for creating a new journal entry
  const journalEntryForm = useForm<z.infer<typeof insertJournalEntrySchema>>({
    resolver: zodResolver(insertJournalEntrySchema),
    defaultValues: {
      obligationId: selectedObligation || null,
      entryNumber: "",
      entryDate: new Date().toISOString(),
      description: "",
      status: "draft",
      createdBy: user?.id || 0,
    },
  });

  // Form for adding journal entry items (debits and credits)
  const journalEntryItemForm = useForm<z.infer<typeof insertJournalEntryItemSchema>>({
    resolver: zodResolver(insertJournalEntryItemSchema),
    defaultValues: {
      journalEntryId: selectedJournalEntry || 0,
      accountCode: "",
      accountTitle: "",
      debit: "0",
      credit: "0",
    },
  });

  // Update form values when selected obligation changes
  React.useEffect(() => {
    if (selectedObligation) {
      journalEntryForm.setValue("obligationId", selectedObligation);
      
      // Get obligation details to prefill description
      const obligation = pendingObligations?.find(o => o.id === selectedObligation);
      if (obligation) {
        journalEntryForm.setValue("description", `Journal entry for obligation ${obligation.obligationNumber} - ${obligation.description}`);
      }
    }
  }, [selectedObligation, pendingObligations, journalEntryForm]);

  // Update item form values when selected journal entry changes
  React.useEffect(() => {
    if (selectedJournalEntry) {
      journalEntryItemForm.setValue("journalEntryId", selectedJournalEntry);
    }
  }, [selectedJournalEntry, journalEntryItemForm]);

  // Mutation for creating a new journal entry
  const createJournalEntryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertJournalEntrySchema>) => {
      const res = await apiRequest("POST", "/api/accounting/journal-entry", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Journal Entry Created",
        description: "The journal entry has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/journal-entries"] });
      setSelectedJournalEntry(data.id);
      journalEntryForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create journal entry: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for adding journal entry items
  const addJournalEntryItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertJournalEntryItemSchema>) => {
      const res = await apiRequest("POST", "/api/accounting/journal-entry-item", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Item Added",
        description: "The journal entry item has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/journal-entry/${selectedJournalEntry}`] });
      journalEntryItemForm.reset({
        journalEntryId: selectedJournalEntry || 0,
        accountCode: "",
        accountTitle: "",
        debit: "0",
        credit: "0",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for posting journal entry
  const postJournalEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/accounting/journal-entry/${id}`, {
        status: "posted",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Journal Entry Posted",
        description: "The journal entry has been posted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/journal-entries"] });
      queryClient.invalidateQueries({ queryKey: [`/api/accounting/journal-entry/${selectedJournalEntry}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to post journal entry: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle journal entry form submission
  const onSubmitJournalEntry = (data: z.infer<typeof insertJournalEntrySchema>) => {
    // Format the date properly
    const formattedData = {
      ...data,
      entryDate: new Date(data.entryDate).toISOString(),
    };
    createJournalEntryMutation.mutate(formattedData);
  };

  // Handle journal entry item form submission
  const onSubmitJournalEntryItem = (data: z.infer<typeof insertJournalEntryItemSchema>) => {
    addJournalEntryItemMutation.mutate(data);
  };

  // Calculate totals for the selected journal entry
  const calculateTotals = () => {
    if (!selectedEntry?.items || selectedEntry.items.length === 0) {
      return { debitTotal: 0, creditTotal: 0 };
    }

    return selectedEntry.items.reduce(
      (acc, item) => {
        return {
          debitTotal: acc.debitTotal + Number(item.debit),
          creditTotal: acc.creditTotal + Number(item.credit),
        };
      },
      { debitTotal: 0, creditTotal: 0 }
    );
  };

  const { debitTotal, creditTotal } = calculateTotals();
  const isBalanced = debitTotal === creditTotal;

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Journal Entries</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-1" />
                New Journal Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Journal Entry</DialogTitle>
              </DialogHeader>
              <Form {...journalEntryForm}>
                <form onSubmit={journalEntryForm.handleSubmit(onSubmitJournalEntry)} className="space-y-4">
                  <FormField
                    control={journalEntryForm.control}
                    name="entryNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Journal Entry Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter entry number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={journalEntryForm.control}
                    name="obligationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Obligation</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value ? Number(e.target.value) : null;
                              field.onChange(value);
                              setSelectedObligation(value);
                            }}
                          >
                            <option value="">No obligation (direct entry)</option>
                            {isLoadingObligations ? (
                              <option disabled>Loading obligations...</option>
                            ) : pendingObligations && pendingObligations.length > 0 ? (
                              pendingObligations.map((obligation) => (
                                <option key={obligation.id} value={obligation.id}>
                                  {obligation.obligationNumber} - {obligation.payee} (₱{Number(obligation.amount).toLocaleString()})
                                </option>
                              ))
                            ) : (
                              <option disabled>No approved obligations available</option>
                            )}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={journalEntryForm.control}
                    name="entryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Date</FormLabel>
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
                    control={journalEntryForm.control}
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

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={createJournalEntryMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {createJournalEntryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Journal Entry
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Journal Entries List */}
          <div className="col-span-1 md:col-span-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">Journal Entries</h3>

                {isLoadingEntries ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !journalEntries || journalEntries.length === 0 ? (
                  <div className="p-4 text-center border border-dashed rounded-md">
                    <p className="text-neutral-500">No journal entries found</p>
                    <p className="text-neutral-400 text-sm mt-1">Create a new journal entry to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {journalEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`p-3 rounded-md cursor-pointer border ${
                          selectedJournalEntry === entry.id
                            ? "border-primary bg-blue-50"
                            : "border-neutral-200 hover:border-primary"
                        }`}
                        onClick={() => setSelectedJournalEntry(entry.id)}
                      >
                        <h4 className="font-medium">{entry.entryNumber}</h4>
                        <p className="text-sm text-neutral-500 truncate">{entry.description}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-neutral-400">
                            {new Date(entry.entryDate).toLocaleDateString()}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              entry.status === "posted"
                                ? "bg-green-100 text-emerald-800"
                                : entry.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Journal Entry Details */}
          <div className="col-span-1 md:col-span-8">
            {!selectedJournalEntry ? (
              <div className="bg-white rounded-lg shadow-sm border border-dashed p-8 flex flex-col items-center justify-center h-full">
                <BookOpen className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-600 mb-2">No Journal Entry Selected</h3>
                <p className="text-neutral-500 text-center mb-4">
                  Select a journal entry from the list or create a new one
                </p>
              </div>
            ) : isLoadingSelectedEntry ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !selectedEntry ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500">Error loading journal entry details</p>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">{selectedEntry.entryNumber}</h3>
                      <p className="text-sm text-neutral-500">
                        Date: {new Date(selectedEntry.entryDate).toLocaleDateString()} | Status: {selectedEntry.status.charAt(0).toUpperCase() + selectedEntry.status.slice(1)}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">{selectedEntry.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      {selectedEntry.status === "draft" && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                className="bg-primary hover:bg-primary/90 text-white"
                                disabled={!isBalanced}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Item
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Add Journal Entry Item</DialogTitle>
                              </DialogHeader>
                              <Form {...journalEntryItemForm}>
                                <form onSubmit={journalEntryItemForm.handleSubmit(onSubmitJournalEntryItem)} className="space-y-4">
                                  <FormField
                                    control={journalEntryItemForm.control}
                                    name="accountCode"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Account Code</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Enter account code" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={journalEntryItemForm.control}
                                    name="accountTitle"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Account Title</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Enter account title" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={journalEntryItemForm.control}
                                      name="debit"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Debit (₱)</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                              {...field}
                                              onChange={(e) => {
                                                field.onChange(e.target.value);
                                                // If debit has value, set credit to 0
                                                if (e.target.value && Number(e.target.value) > 0) {
                                                  journalEntryItemForm.setValue("credit", "0");
                                                }
                                              }}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={journalEntryItemForm.control}
                                      name="credit"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Credit (₱)</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                              {...field}
                                              onChange={(e) => {
                                                field.onChange(e.target.value);
                                                // If credit has value, set debit to 0
                                                if (e.target.value && Number(e.target.value) > 0) {
                                                  journalEntryItemForm.setValue("debit", "0");
                                                }
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
                                      disabled={addJournalEntryItemMutation.isPending}
                                      className="bg-primary hover:bg-primary/90 text-white"
                                    >
                                      {addJournalEntryItemMutation.isPending && (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      )}
                                      Add Item
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>

                          <Button
                            onClick={() => postJournalEntryMutation.mutate(selectedEntry.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={!isBalanced || postJournalEntryMutation.isPending}
                          >
                            {postJournalEntryMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4 mr-1" />
                            )}
                            Post Journal Entry
                          </Button>
                        </>
                      )}

                      {selectedEntry.status === "posted" && (
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Create Voucher
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Journal Entry Items */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-neutral-50 text-left">
                          <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Account Code
                          </th>
                          <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Account Title
                          </th>
                          <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider text-right">
                            Debit
                          </th>
                          <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider text-right">
                            Credit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {!selectedEntry.items || selectedEntry.items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-neutral-500">
                              No items found for this journal entry
                            </td>
                          </tr>
                        ) : (
                          selectedEntry.items.map((item, index) => (
                            <tr key={item.id || index}>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-600">
                                {item.accountCode}
                              </td>
                              <td className="px-4 py-3 text-sm text-neutral-500">{item.accountTitle}</td>
                              <td className="px-4 py-3 text-sm text-neutral-500 text-right">
                                {Number(item.debit) > 0 ? `₱${Number(item.debit).toLocaleString()}` : ""}
                              </td>
                              <td className="px-4 py-3 text-sm text-neutral-500 text-right">
                                {Number(item.credit) > 0 ? `₱${Number(item.credit).toLocaleString()}` : ""}
                              </td>
                            </tr>
                          ))
                        )}
                        {/* Totals row */}
                        <tr className="bg-neutral-50 font-semibold">
                          <td className="px-4 py-3 text-sm" colSpan={2}>
                            Total
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            ₱{debitTotal.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            ₱{creditTotal.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Balance status */}
                  {selectedEntry.items && selectedEntry.items.length > 0 && (
                    <div className={`p-3 text-center text-sm font-medium ${
                      isBalanced ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {isBalanced
                        ? "Journal entry is balanced ✓"
                        : `Journal entry is not balanced (Difference: ₱${Math.abs(debitTotal - creditTotal).toLocaleString()})`}
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
