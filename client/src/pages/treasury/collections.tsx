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
  Banknote,
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
import { Collection, insertCollectionSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

export default function Collections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch collections
  const {
    data: collections,
    isLoading: isLoadingCollections,
  } = useQuery<Collection[]>({
    queryKey: ["/api/treasury/collections"],
  });

  // Filter collections by type and search query
  const filteredCollections = collections
    ? collections
        .filter((collection) => selectedType === "all" || collection.collectionType === selectedType)
        .filter(
          (collection) =>
            !searchQuery ||
            collection.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            collection.payor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            collection.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : [];

  // Form for creating a new collection
  const collectionForm = useForm<z.infer<typeof insertCollectionSchema>>({
    resolver: zodResolver(insertCollectionSchema),
    defaultValues: {
      receiptNumber: "",
      collectionDate: new Date().toISOString(),
      payor: "",
      description: "",
      amount: "0",
      collectionType: "tax",
      accountCode: "",
      status: "recorded",
      createdBy: user?.id || 0,
    },
  });

  // Mutation for creating a new collection
  const createCollectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCollectionSchema>) => {
      const res = await apiRequest("POST", "/api/treasury/collection", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Collection Recorded",
        description: "The collection has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/collections"] });
      collectionForm.reset({
        receiptNumber: "",
        collectionDate: new Date().toISOString(),
        payor: "",
        description: "",
        amount: "0",
        collectionType: "tax",
        accountCode: "",
        status: "recorded",
        createdBy: user?.id || 0,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to record collection: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle collection form submission
  const onSubmitCollection = (data: z.infer<typeof insertCollectionSchema>) => {
    // Format the date properly
    const formattedData = {
      ...data,
      collectionDate: new Date(data.collectionDate).toISOString(),
    };
    createCollectionMutation.mutate(formattedData);
  };

  // Collection type options
  const collectionTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "tax", label: "Taxes" },
    { value: "fee", label: "Fees" },
    { value: "fine", label: "Fines" },
    { value: "business_permit", label: "Business Permits" },
    { value: "license", label: "Licenses" },
    { value: "other", label: "Other" },
  ];

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Collections</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-1" />
                Record New Collection
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Record New Collection</DialogTitle>
              </DialogHeader>
              <Form {...collectionForm}>
                <form onSubmit={collectionForm.handleSubmit(onSubmitCollection)} className="space-y-4">
                  <FormField
                    control={collectionForm.control}
                    name="receiptNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter receipt number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={collectionForm.control}
                    name="payor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payor</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter payor name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={collectionForm.control}
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
                      control={collectionForm.control}
                      name="collectionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collection Date</FormLabel>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={collectionForm.control}
                      name="collectionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collection Type</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              {...field}
                            >
                              <option value="tax">Tax</option>
                              <option value="fee">Fee</option>
                              <option value="fine">Fine</option>
                              <option value="business_permit">Business Permit</option>
                              <option value="license">License</option>
                              <option value="other">Other</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={collectionForm.control}
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
                  </div>

                  <FormField
                    control={collectionForm.control}
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
                      disabled={createCollectionMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {createCollectionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Record Collection
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
              placeholder="Search collections..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="rounded-md border border-neutral-300 h-10 text-sm px-3 py-2 bg-white w-full sm:w-auto min-w-[150px]"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {collectionTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Collection List */}
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="font-medium text-neutral-600">Collections</h3>
            </div>

            {isLoadingCollections ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !filteredCollections || filteredCollections.length === 0 ? (
              <div className="p-8 text-center">
                <Banknote className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">No collections found</p>
                <p className="text-neutral-400 text-sm mt-1">
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : selectedType !== "all"
                    ? `No collections of type "${selectedType}"`
                    : "Record a new collection to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-neutral-50 text-left">
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Receipt #
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Payor
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Type
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
                    {filteredCollections.map((collection) => (
                      <tr key={collection.id}>
                        <td className="px-4 py-3 text-sm font-medium text-neutral-600">
                          {collection.receiptNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">{collection.payor}</td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          <div className="max-w-xs truncate">{collection.description}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          ₱{Number(collection.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          {collection.collectionType.charAt(0).toUpperCase() + 
                           collection.collectionType.slice(1).replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          {new Date(collection.collectionDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              collection.status === "deposited"
                                ? "bg-green-100 text-emerald-800"
                                : collection.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-primary"
                            }`}
                          >
                            {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
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
                              {collection.status === "recorded" && (
                                <DropdownMenuItem>
                                  <Banknote className="h-4 w-4 mr-2" />
                                  Mark as Deposited
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
