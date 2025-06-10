// src/app/owner-update/owner-update.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OwnerUpdateService, OwnerUpdatePayload } from '../owner-update.service'; // Import OwnerUpdatePayload
import { Owner } from '../registerservice.service'; // Re-use the Owner interface
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { switchMap, catchError, EMPTY } from 'rxjs'; // Import switchMap and EMPTY

@Component({
  selector: 'admin-owner-update',
  templateUrl: './owner-update.component.html',
  styleUrls: ['./owner-update.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class OwnerUpdateComponent implements OnInit {
  ownerUpdateForm: FormGroup;
  currentOwnerName: string | null = null;
  currentOwnerId: number | null = null; // Store the fetched ownerId
  loading: boolean = false; // Added loading state
  error: string | null = null; // Added error message state
  successMessage: string | null = null; // Added success message state

  constructor(
    private fb: FormBuilder,
    private ownerUpdateService: OwnerUpdateService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.ownerUpdateForm = this.fb.group({
      ownerId: [{ value: '', disabled: true }], // Display ownerId, not editable
      name: [{ value: '', disabled: true }],     // Display name, not editable
      email: ['', [Validators.required, Validators.email]],
      contact: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]], // 10-digit number
      address: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.initOwnerDetails(); // Load current owner's data
  }

  initOwnerDetails(): void {
    this.loading = true; // Set loading state
    this.error = null;
    this.successMessage = null;

    this.currentOwnerName = this.authService.getUsernameFromToken();
    console.log('OwnerUpdateComponent: initOwnerDetails - Username from token:', this.currentOwnerName);

    if (!this.currentOwnerName) {
      this.error = 'You are not logged in or your session has expired. Please log in again.';
      console.error('OwnerUpdateComponent: initOwnerDetails - No username found from token.');
      alert(this.error);
      this.router.navigate(['/login']);
      this.loading = false; // Reset loading
      return;
    }

    // --- Start of chained calls ---
    this.ownerUpdateService.getOwnerIdByName(this.currentOwnerName).pipe(
      switchMap(ownerId => {
        // After successfully getting the ownerId, use it to fetch the full details
        if (ownerId === null || ownerId === undefined || ownerId <= 0) {
          throw new Error('Invalid owner ID received after lookup.');
        }
        this.currentOwnerId = ownerId; // Store the ID for later update
        return this.ownerUpdateService.getOwnerById(ownerId);
      }),
      catchError(err => {
        this.error = `Failed to load owner details: ${err.message || 'An error occurred.'}`;
        console.error('OwnerUpdateComponent: initOwnerDetails - Error in chained fetch:', err);
        alert(this.error);
        this.router.navigate(['/login']);
        this.loading = false; // Reset loading
        return EMPTY; // Stop the observable chain
      })
    ).subscribe({
      next: (owner: Owner) => {
        console.log('OwnerUpdateComponent: initOwnerDetails - Received full owner object in component:', owner);
        if (owner && typeof owner.ownerId === 'number' && owner.ownerId > 0) {
          // patchValue will only update fields that exist in the form group
          this.ownerUpdateForm.patchValue({
            ownerId: owner.ownerId, // This is explicitly shown now
            name: owner.name,         // This is explicitly shown now
            email: owner.email,
            contact: owner.contact,
            address: owner.address
          });
          console.log('OwnerUpdateComponent: initOwnerDetails - Form patched with:', this.ownerUpdateForm.value);
        } else {
          this.error = 'Owner ID not found or is invalid in fetched profile data. Cannot display profile.';
          console.error('OwnerUpdateComponent: initOwnerDetails - Full owner object is invalid:', owner);
          alert(this.error);
          this.router.navigate(['/login']);
        }
        this.loading = false; // Reset loading
      },
      complete: () => {
        this.loading = false; // Ensure loading is reset on completion
      }
    });
    // --- End of chained calls ---
  }

  onSubmit(): void {
    this.ownerUpdateForm.markAllAsTouched();
    if (this.ownerUpdateForm.invalid) {
      this.error = 'Please correct the errors in the form.';
      return;
    }

    this.loading = true; // Set loading state
    this.error = null;
    this.successMessage = null;

    if (this.currentOwnerId === null) {
      this.error = 'Owner ID is missing. Cannot update profile.';
      this.loading = false; // Reset loading
      alert(this.error);
      console.error('OwnerUpdateComponent: onSubmit - currentOwnerId is null, cannot proceed with update.');
      return;
    }

    const formValue = this.ownerUpdateForm.getRawValue();

    const requestBody: OwnerUpdatePayload = {
      name: formValue.name,      // Include name as per your Postman example
      email: formValue.email,
      contact: formValue.contact,
      address: formValue.address
    };

    console.log('OwnerUpdateComponent: onSubmit - Sending update request for ownerId:', this.currentOwnerId, 'with payload:', requestBody);

    this.ownerUpdateService.updateOwner(this.currentOwnerId, requestBody).subscribe({
      next: (response) => {
        this.successMessage = 'Profile updated successfully!';
        console.log('OwnerUpdateComponent: onSubmit - Owner updated successfully:', response);
        alert(this.successMessage);
        this.router.navigate(["/owner-home"]);
        this.loading = false; // Reset loading
      },
      error: (err) => {
        this.error = `Failed to update profile: ${err.message || err.error || 'An error occurred.'}`;
        console.error('OwnerUpdateComponent: onSubmit - Error updating owner:', err);
        alert(this.error);
        this.loading = false; // Reset loading
      }
    });
  }

  onReset(): void {
    this.initOwnerDetails(); // Re-fetch original data to reset the form
    this.ownerUpdateForm.markAsUntouched();
    this.error = null;
    this.successMessage = null;
  }
}
