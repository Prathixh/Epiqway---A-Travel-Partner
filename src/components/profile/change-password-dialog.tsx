
'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Icons from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { reauthenticateAndChangePassword } from '@/firebase/auth/auth';

const currentPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
});

const newPasswordSchema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type CurrentPasswordFormValues = z.infer<typeof currentPasswordSchema>;
type NewPasswordFormValues = z.infer<typeof newPasswordSchema>;

interface ChangePasswordDialogProps {
  children: React.ReactNode;
}

export default function ChangePasswordDialog({ children }: ChangePasswordDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const currentPasswordForm = useForm<CurrentPasswordFormValues>({
    resolver: zodResolver(currentPasswordSchema),
    defaultValues: { currentPassword: '' },
  });

  const newPasswordForm = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const handleCurrentPasswordSubmit: SubmitHandler<CurrentPasswordFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      // We'll reauthenticate here to verify the current password, but won't change it yet
      await reauthenticateAndChangePassword(data.currentPassword, data.currentPassword);
      setStep(2);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Incorrect Password',
        description: 'The password you entered is incorrect. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleNewPasswordSubmit: SubmitHandler<NewPasswordFormValues> = async (data) => {
    setIsSubmitting(true);
    const currentPassword = currentPasswordForm.getValues('currentPassword');
    try {
      await reauthenticateAndChangePassword(currentPassword, data.newPassword);
      toast({
        title: 'Password Changed Successfully',
        description: 'Your new password has been set.',
      });
      resetAndClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error.message || 'Could not change your password. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setTimeout(() => {
        setStep(1);
        currentPasswordForm.reset();
        newPasswordForm.reset();
    }, 300);
  };
  
  const handleOpenChange = (open: boolean) => {
      if (!open) {
          resetAndClose();
      } else {
          setIsOpen(true);
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                For your security, please enter your current password to continue.
              </DialogDescription>
            </DialogHeader>
            <Form {...currentPasswordForm}>
              <form onSubmit={currentPasswordForm.handleSubmit(handleCurrentPasswordSubmit)} className="space-y-4">
                <FormField
                  control={currentPasswordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={resetAndClose}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Icons.Loader className="mr-2 animate-spin" />}
                    Verify
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Set New Password</DialogTitle>
              <DialogDescription>
                Please enter and confirm your new password.
              </DialogDescription>
            </DialogHeader>
            <Form {...newPasswordForm}>
              <form onSubmit={newPasswordForm.handleSubmit(handleNewPasswordSubmit)} className="space-y-4">
                <FormField
                  control={newPasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Icons.Loader className="mr-2 animate-spin" />}
                        Change Password
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
