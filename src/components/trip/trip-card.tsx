
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { setActiveTrip, deleteTrip, saveTrip } from '@/lib/trip-manager';
import Icons from '@/components/icons';
import { format, isPast } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Trip, Expense } from '@/lib/trip';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import ExpenseTracker from '@/components/expense/expense-tracker';
import { cn } from '@/lib/utils';

interface TripCardProps {
    trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const expensesQuery = useMemoFirebase(() => 
        user && firestore ? query(collection(firestore, 'users', user.uid, 'trips', trip.id, 'expenses')) : null
    , [firestore, user, trip.id]);

    const { data: expenses } = useCollection<Expense>(expensesQuery);

    const totalSpent = expenses?.reduce((acc, expense) => acc + expense.amount, 0) || 0;
    const isOverBudget = totalSpent > trip.cost;

    const handleTripClick = (tripId: string) => {
        setActiveTrip(tripId);
        router.push('/planner');
    };

    const handleDeleteTrip = (tripId: string) => {
        if (!user) return;
        deleteTrip(user.uid, tripId);
        toast({
            title: 'Trip Deleted',
            description: 'The trip has been successfully deleted.',
        });
    };

    const handleToggleStatus = (trip: Trip) => {
        if (!user) return;
        const newStatus = trip.status === 'completed' ? 'ongoing' : 'completed';
        const updatedTrip = { ...trip, status: newStatus };
        saveTrip(user.uid, updatedTrip, trip.id);
        toast({
            title: 'Trip Status Updated',
            description: `The trip has been marked as ${newStatus}.`,
        });
    };
    
    const handleExpenseAdded = (trip: Trip, newTotalExpense: number) => {
        if (!user) return;
        // The total spent is now calculated from the collection, 
        // so we just need to ensure the parent page re-evaluates if necessary.
        // For now, we just show a toast.
         toast({
            title: 'Expense Recorded',
            description: `A new expense has been added to ${trip.name}.`,
        });
    }

    const getTripStatus = (trip: Trip): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
        if (trip.status === 'completed') {
            return { text: 'Completed', variant: 'secondary' };
        }
        if (trip.status === 'ongoing') {
            return { text: 'Ongoing', variant: 'default' };
        }
        if (isPast(new Date(trip.startDate)) && trip.status === 'pending') {
            return { text: 'Missed', variant: 'destructive' };
        }
        return { text: 'Pending', variant: 'outline' };
    };

    const status = getTripStatus(trip);

    return (
        <Card className="flex flex-col">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex justify-between items-start">
                    <span>{trip.name}</span>
                    <Badge variant={status.variant}>{status.text}</Badge>
                </CardTitle>
                <CardDescription>{trip.destination}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-4 sm:p-6">
                <p className="text-sm text-muted-foreground">
                    {format(new Date(trip.startDate), 'PPP')} for {trip.days} day{trip.days > 1 ? 's' : ''}
                </p>
                <div className='mt-2 space-y-1'>
                    <p className="text-sm">
                        <span className='font-semibold text-muted-foreground'>Approx. Amount: </span> 
                        <span className="font-semibold">Rs.{trip.cost.toLocaleString('en-IN')}</span>
                    </p>
                    <p className={cn("text-sm", isOverBudget && "text-destructive")}>
                        <span className={cn('font-semibold', isOverBudget ? 'text-destructive/80' : 'text-muted-foreground')}>Spent Amount: </span>
                        <span className="font-semibold">Rs.{totalSpent.toLocaleString('en-IN')}</span>
                    </p>
                </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2 border-t p-2 sm:p-4">
                <Button className="w-full h-9" onClick={() => handleTripClick(trip.id)}>
                    <Icons.Plane className="mr-2 h-4 w-4" /> View Itinerary
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="h-9">
                            <Icons.Wallet className="mr-2 h-4 w-4" /> Expenses
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Expenses for {trip.name}</DialogTitle>
                            <DialogDescription>
                                Add, view, and analyze expenses for this trip.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="overflow-auto flex-1">
                            <ExpenseTracker trip={trip} onExpenseAdded={handleExpenseAdded} />
                        </div>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={() => handleToggleStatus(trip)} className="h-9">
                    <Icons.CheckCircle className="mr-2 h-4 w-4" />
                    {trip.status === 'completed' ? 'Mark Ongoing' : 'Mark Completed'}
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="h-9">
                            <Icons.Trash className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your
                                trip and remove its data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTrip(trip.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}
