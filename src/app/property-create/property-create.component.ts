// src/app/property-create/property-create.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Property } from '../registerservice.service'; // Import Property interface
import { PropertyCreateService } from '../property-create.service'; // Import new service
import { AuthService } from '../auth.service';
import { OwnerUpdateService } from '../owner-update.service'; // To get ownerId by name
import { switchMap, catchError, EMPTY } from 'rxjs'; // RxJS operators

@Component({
  selector: 'property-create',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './property-create.component.html',
  styleUrls: ['./property-create.component.css']
})
export class PropertyCreateComponent implements OnInit {
  propertyForm: FormGroup;
  currentOwnerName: string | null = null;
  currentOwnerId: number | null = null;
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Options for the availability status dropdown
  availabilityStatuses: ('AVAILABLE' | 'OCCUPIED' | 'UNDER_MAINTENANCE')[] = [
    'AVAILABLE',
    'OCCUPIED',
    'UNDER_MAINTENANCE'
  ];

  constructor(
    private fb: FormBuilder,
    private propertyCreateService: PropertyCreateService,
    private authService: AuthService,
    private ownerUpdateService: OwnerUpdateService, // Used to fetch ownerId
    private router: Router
  ) { }

  ngOnInit(): void {
    // Initialize the form with validators and disabled ownerId field
    this.propertyForm = this.fb.group({
      propertyName: ['', [Validators.required, Validators.minLength(3)]],
      ownerId: [{ value: '', disabled: true }, Validators.required], // ownerId is required but not editable
      address: ['', [Validators.required, Validators.minLength(5)]],
      rentAmount: ['', [Validators.required, Validators.min(1)]],
      period: ['', [Validators.required, Validators.min(1)]],
      image: ['', [Validators.required, Validators.pattern(/^(ftp|http|https):\/\/[^ "]+$/)]], // Basic URL validation
      propertyDetails: ['', [Validators.required, Validators.minLength(10)]],
      availabilityStatus: ['AVAILABLE', Validators.required] // Default to AVAILABLE
    });

    // Fetch the ownerId and populate the form
    this.initOwnerId();
  }

  initOwnerId(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.currentOwnerName = this.authService.getUsernameFromToken();
    console.log('PropertyCreateComponent: initOwnerId - Username from token:', this.currentOwnerName);

    if (!this.currentOwnerName) {
      this.error = 'You are not logged in as an Owner. Please log in again.';
      console.error('PropertyCreateComponent: initOwnerId - No username found from token. Redirecting.');
      alert(this.error);
      this.router.navigate(['/login']);
      this.loading = false;
      return;
    }

    // Fetch ownerId by name using OwnerUpdateService
    this.ownerUpdateService.getOwnerIdByName(this.currentOwnerName).pipe(
      switchMap(ownerId => {
        console.log('PropertyCreateComponent: initOwnerId - Fetched owner ID:', ownerId);
        if (ownerId === null || ownerId === undefined || ownerId <= 0) {
          throw new Error('Invalid Owner ID received. Cannot create property.');
        }
        this.currentOwnerId = ownerId; // Store the ownerId
        this.propertyForm.controls['ownerId'].patchValue(ownerId); // Patch ownerId to the form
        return EMPTY; // Stop chain, as we only need the ownerId here, not a full owner object
      }),
      catchError(err => {
        this.error = `Failed to retrieve your Owner ID: ${err.message || 'An error occurred.'}`;
        console.error('PropertyCreateComponent: initOwnerId - Error fetching owner ID:', err);
        alert(this.error);
        this.router.navigate(['/owner-home']); // Redirect on error
        this.loading = false;
        return EMPTY;
      })
    ).subscribe({
      complete: () => {
        this.loading = false; // Owner ID fetch complete (or error handled)
      }
    });
  }

  onSubmit(): void {
    this.propertyForm.markAllAsTouched(); // Mark all fields as touched to show validation errors
    if (this.propertyForm.invalid) {
      this.error = 'Please correct the errors in the form.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    // Ensure currentOwnerId is set before proceeding
    if (this.currentOwnerId === null) {
      this.error = 'Owner ID is missing. Cannot create property.';
      this.loading = false;
      alert(this.error);
      console.error('PropertyCreateComponent: onSubmit - currentOwnerId is null.');
      return;
    }

    // Get raw form values including disabled controls (ownerId)
    const formValue = this.propertyForm.getRawValue();

    // Construct the payload matching the Property interface
    const newProperty: Property = {
      propertyName: formValue.propertyName,
      ownerId: this.currentOwnerId, // Use the fetched ownerId
      address: formValue.address,
      rentAmount: formValue.rentAmount,
      period: formValue.period,
      image: formValue.image,
      propertyDetails: formValue.propertyDetails,
      availabilityStatus: formValue.availabilityStatus // Cast to correct type if needed, but should match
    };

    console.log('PropertyCreateComponent: onSubmit - Submitting new property:', newProperty);

    this.propertyCreateService.saveProperty(newProperty).subscribe({
      next: (response) => {
        this.successMessage = 'Property created successfully!';
        console.log('Property created:', response);
        alert(this.successMessage);
        this.propertyForm.reset(); // Reset form fields
        this.initOwnerId(); // Re-fetch ownerId to reset the disabled field value
        this.router.navigate(['/owner-property']); // Navigate back to properties list
      },
      error: (err) => {
        this.error = `Failed to create property: ${err.message || err.error || 'An unknown error occurred.'}`;
        console.error('PropertyCreateComponent: onSubmit - Error creating property:', err);
        alert(this.error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onReset(): void {
    this.propertyForm.reset(); // Reset all form controls
    this.initOwnerId(); // Re-fetch ownerId to reset the disabled field value
    this.propertyForm.markAsUntouched(); // Clear touched state
    this.error = null;
    this.successMessage = null;
  }
}
