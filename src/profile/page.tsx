
'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MainSidebar from '@/components/layout/main-sidebar';
import Header from '@/components/layout/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { clearActiveTrip, deleteAllUserTrips } from '@/lib/trip-manager';
import Icons from '@/components/icons';
import StatsChart from '@/components/profile/stats-chart';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { signOut as firebaseSignOut, updateUserProfile } from '@/firebase/auth/auth';
import { collection, query } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/layout/bottom-nav';
import { Trip } from '@/lib/trip';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { ThemeToggle } from '@/components/theme-toggle';
import ChangePasswordDialog from '@/components/profile/change-password-dialog';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, status: userStatus } = useUser();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(user?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);

  const tripsQuery = useMemoFirebase(() => 
    user && firestore ? query(collection(firestore, 'users', user.uid, 'trips')) : null
  , [firestore, user]);

  const { data: trips } = useCollection<Trip>(tripsQuery);

  const handleNewTrip = () => {
    clearActiveTrip();
    router.push('/planner');
  };

  const handleLogout = async () => {
    await firebaseSignOut();
    clearActiveTrip();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    if (user) {
      await deleteAllUserTrips(user.uid);
      await firebaseSignOut(); // This should be updated to delete the user account
      toast({
        variant: 'destructive',
        title: "Account Deleted",
        description: "Your account and all your data have been permanently deleted.",
      });
      router.push('/register');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newAvatar = reader.result as string;
        try {
          await updateUserProfile({ photoURL: newAvatar });
          toast({
            title: "Avatar Updated",
            description: "Your new profile picture has been saved.",
          });
        } catch (error) {
           toast({
            variant: 'destructive',
            title: "Update Failed",
            description: "Could not update your profile picture.",
          });
        } finally {
            setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditName = () => {
    setEditingName(user?.displayName || '');
    setIsEditingName(true);
  };
  
  const handleCancelEditName = () => {
    setIsEditingName(false);
  };

  const handleSaveName = async () => {
    if (user && editingName.trim() !== '' && editingName !== user.displayName) {
      setIsSavingName(true);
      try {
        await updateUserProfile({ displayName: editingName });
        toast({
          title: 'Name Updated',
          description: 'Your display name has been successfully updated.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not update your name.',
        });
      } finally {
        setIsSavingName(false);
        setIsEditingName(false);
      }
    } else {
        setIsEditingName(false);
    }
  };
  
  const completedTrips = trips ? trips.filter(trip => trip.status === 'completed').length : 0;
  const ongoingTrips = trips ? trips.filter(trip => trip.status === 'ongoing').length : 0;
  const userInitials = user?.displayName?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U';

  return (
    <SidebarProvider>
      <MainSidebar trip={null} onNewTrip={handleNewTrip} />
      <div className="flex flex-col sm:h-svh sm:overflow-hidden">
        <Header trip={null} currentDay={1} onDayChange={() => {}} onItineraryUpdate={() => {}} />
        <SidebarInset className="max-h-full overflow-auto pb-16 sm:pb-0">
          <div className="p-4 w-full">
            <div className="mb-6 max-w-[400px] mx-auto">
              <h1 className="text-3xl font-bold font-headline">My Profile</h1>
            </div>
            
            <div className="flex flex-col items-center gap-6 w-full">
              <Card className="w-full max-w-[400px] rounded-2xl shadow-sm p-4">
                <CardContent className="flex flex-col items-center text-center p-0">
                  <div className="relative mb-4">
                    <Avatar className="w-[110px] h-[110px]" >
                      <AvatarImage src={user?.photoURL || undefined} alt="User Avatar" />
                      <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
                    </Avatar>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                    <Button onClick={handleAvatarClick} variant="outline" size="icon" className="absolute bottom-1 right-1 bg-background hover:bg-muted rounded-full h-8 w-8" disabled={isUploading}>
                      {isUploading ? <Icons.Loader className="h-4 w-4 animate-spin"/> : <Icons.Camera className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {isEditingName ? (
                     <div className="w-full max-w-[250px] mx-auto space-y-3">
                      <Input 
                        value={editingName} 
                        onChange={(e) => setEditingName(e.target.value)} 
                        className="text-center text-lg font-bold"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" onClick={handleSaveName} disabled={isSavingName}>
                            {isSavingName ? <Icons.Loader className="mr-2" /> : <Icons.Save className="mr-2"/>}
                            Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEditName}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{user?.displayName || 'Wanderer'}</h2>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEditName}>
                        <Icons.Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground mt-1">{user?.email || 'no-email@example.com'}</p>
                
                  <div className="w-full grid grid-cols-2 text-center mt-6 border-t pt-4">
                      <div>
                          <p className="text-2xl font-bold">{completedTrips}</p>
                          <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                      <div>
                          <p className="text-2xl font-bold">{ongoingTrips}</p>
                          <p className="text-sm text-muted-foreground">Ongoing</p>
                      </div>
                  </div>

                </CardContent>
              </Card>

              <div className="w-full max-w-[400px] space-y-3">
                <h3 className="font-semibold text-lg px-1 text-left">Appearance</h3>
                <Card className="w-full h-[52px] flex items-center justify-between px-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <Icons.Moon className="h-5 w-5" />
                    <span className="text-base">Dark Mode</span>
                  </div>
                  <ThemeToggle />
                </Card>
              </div>

              <div className="w-full max-w-[400px] space-y-3">
                <h3 className="font-semibold text-lg px-1 text-left">Account Actions</h3>
                <ChangePasswordDialog>
                    <Button variant="outline" className="w-full h-[52px] justify-start text-base rounded-xl bg-gray-100 dark:bg-gray-800">
                      <Icons.Flame className="mr-3" /> Change Password
                    </Button>
                </ChangePasswordDialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full h-[52px] justify-start text-base rounded-xl bg-gray-100 dark:bg-gray-800">
                      <Icons.LogOut className="mr-3" /> Logout
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full h-[52px] justify-start text-base rounded-xl bg-red-600 hover:bg-red-700 text-white">
                      <Icons.UserX className="mr-3" /> Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all your trip data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">Delete My Account</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="w-full max-w-[400px]">
                <Card className="rounded-2xl w-full">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-left">
                          <Icons.BarChart className="h-5 w-5" />
                          Your Stats
                      </CardTitle>
                      <CardDescription className="text-left">
                          A summary of your travel activity over the last 12 months.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="w-full max-w-[350px] mx-auto">
                      <StatsChart trips={trips || []} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </SidebarInset>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
