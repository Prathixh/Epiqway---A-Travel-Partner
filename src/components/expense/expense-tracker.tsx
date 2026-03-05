
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays, format } from 'date-fns';
import { Trip, Expense } from '@/lib/trip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icons from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, query, serverTimestamp } from 'firebase/firestore';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import ExpenseChart from './expense-chart';
import { useIsMobile } from '@/hooks/use-mobile';

const expenseSchema = z.object({
  category: z.enum(["Food", "Transport", "Accommodation", "Activities", "Shopping", "Other"]),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
  billDate: z.string().min(1, 'Date is required'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseTrackerProps {
  trip: Trip;
  onExpenseAdded?: (trip: Trip, newTotalExpense: number) => void;
}

export default function ExpenseTracker({ trip, onExpenseAdded }: ExpenseTrackerProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const isMobile = useIsMobile();

  const expensesQuery = useMemoFirebase(() =>
    user && firestore ? query(collection(firestore, `users/${user.uid}/trips/${trip.id}/expenses`)) : null
  , [firestore, user, trip.id]);

  const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'Food',
      amount: 0,
      description: '',
      billDate: trip.startDate,
    },
  });

  const tripDates = Array.from({ length: trip.days }, (_, i) => addDays(new Date(trip.startDate), i));

  const totalExpense = expenses?.reduce((acc, exp) => acc + exp.amount, 0) || 0;

  const onSubmit: SubmitHandler<ExpenseFormValues> = async (data) => {
    if (!user) return;
    try {
      const expensesCollectionRef = collection(firestore, `users/${user.uid}/trips/${trip.id}/expenses`);
      await addDoc(expensesCollectionRef, { ...data, tripId: trip.id, createdAt: serverTimestamp() });
      
      const newTotalExpense = totalExpense + data.amount;

      if (onExpenseAdded) {
        onExpenseAdded(trip, newTotalExpense);
      }

      toast({
        title: 'Expense Added',
        description: 'Your expense has been successfully recorded.',
      });
      form.reset({
        category: 'Food',
        amount: 0,
        description: '',
        billDate: trip.startDate,
      });
    } catch (error) {
      console.error('Failed to add expense:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to add expense',
        description: 'There was an error saving your expense. Please try again.',
      });
    }
  };


  return (
    <div className="grid gap-4 lg:grid-cols-5 h-full">
      <Card className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>Add Expense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["Food", "Transport", "Accommodation", "Activities", "Shopping", "Other"].map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Input placeholder="e.g., Lunch at a cafe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a date" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tripDates.map(date => (
                          <SelectItem key={date.toISOString()} value={date.toISOString()}>
                            {format(date, 'PPP')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="p-4 sm:p-6">
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Icons.Loader className="mr-2 animate-spin" />}
                Add Expense
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="lg:col-span-3 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <CardTitle>Trip Expenses</CardTitle>
          <div className="flex gap-2">
              <Dialog>
                  <DialogTrigger asChild>
                     <Button variant="outline" size={isMobile ? 'sm' : 'default'} disabled={!expenses || expenses.length === 0}>
                         <Icons.BarChart className="mr-2 h-4 w-4" />
                         Analyze
                     </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[350px] w-full">
                      <DialogHeader>
                          <DialogTitle className="text-center">Expense Analysis</DialogTitle>
                      </DialogHeader>
                      <div className="h-full w-full max-w-[280px] mx-auto">
                        <ExpenseChart expenses={expenses || []} />
                      </div>
                  </DialogContent>
              </Dialog>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 sm:p-4 sm:pt-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><Icons.Loader className="animate-spin" /></div>
          ) : expenses && expenses.length > 0 ? (
              <ScrollArea className="h-full max-h-[400px] sm:max-h-none">
                  <Table>
                      <TableHeader>
                      <TableRow>
                          <TableHead className="px-2 sm:px-4">Date</TableHead>
                          <TableHead className="px-2 sm:px-4">Category</TableHead>
                          <TableHead className="hidden sm:table-cell px-4">Description</TableHead>
                          <TableHead className="text-right px-2 sm:px-4">Amount</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {expenses.sort((a,b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime()).map((expense) => (
                          <TableRow key={expense.id}>
                          <TableCell className="text-xs px-2 sm:px-4">{format(new Date(expense.billDate), 'PP')}</TableCell>
                          <TableCell className="px-2 sm:px-4">{expense.category}</TableCell>
                          <TableCell className="hidden sm:table-cell px-4">{expense.description}</TableCell>
                          <TableCell className="text-right px-2 sm:px-4">Rs.{expense.amount.toLocaleString()}</TableCell>
                          </TableRow>
                      ))}
                      </TableBody>
                  </Table>
              </ScrollArea>
          ): (
            <div className="text-center py-16 border-2 border-dashed rounded-lg m-4 sm:m-0">
              <Icons.Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Expenses Recorded</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add an expense using the form to see it here.
              </p>
            </div>
          )}
        </CardContent>
        {expenses && expenses.length > 0 && (
           <CardFooter className="justify-end font-bold text-lg border-t p-4 sm:p-6">
              Total: Rs.{totalExpense.toLocaleString()}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
