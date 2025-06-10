// src/app/lease-update/lease-update.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LeaseService, LeaseUpdatePayload } from '../lease.service';
import { Lease } from '../registerservice.service';
import { catchError, EMPTY } from 'rxjs';

@Component({
  selector: 'lease-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lease-update.component.html',
  styleUrls: ['./lease-update.component.css']
})
export class LeaseUpdateComponent implements OnInit {
  leaseUpdateForm: FormGroup;
  leaseId: number | null = null;
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  leaseStatuses: ('ACTIVE' | 'EXTENDED' | 'TERMINATED')[] = ['ACTIVE', 'EXTENDED', 'TERMINATED'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private leaseService: LeaseService
  ) { }

  ngOnInit(): void {
    console.log('LeaseUpdateComponent: ngOnInit started.');
    this.initForm();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id'); // 'id' should match the route parameter name (e.g., /lease-update/:id)
      console.log('LeaseUpdateComponent: Route param "id" received:', id);
      if (id) {
        this.leaseId = +id;
        this.loadLeaseDetails(this.leaseId);
      } else {
        this.error = 'Lease ID not provided in URL. Cannot update lease.';
        console.error('LeaseUpdateComponent: No Lease ID in URL.');
        // Using alert() as per previous context; consider custom modal for better UX.
        alert(this.error);
        this.router.navigate(['/lease-management']);
        this.loading = false;
      }
    });
  }

  initForm(): void {
    console.log('LeaseUpdateComponent: Initializing form.');
    this.leaseUpdateForm = this.fb.group({
      leaseId: [{ value: '', disabled: true }], // Display only
      propertyId: [{ value: '', disabled: true }], // Display only
      tenantId: [{ value: '', disabled: true }], // Display only
      ownerId: [{ value: '', disabled: true }], // Display only
      period: ['', [Validators.required, Validators.min(1)]], // Period is now number
      startDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]], // DD/MM/YYYY
      endDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]], // DD/MM/YYYY
      agreementDetails: ['', [Validators.required, Validators.minLength(5)]],
      rentAmount: ['', [Validators.required, Validators.min(1)]],
      leaseStatus: ['', Validators.required]
    });
    console.log('LeaseUpdateComponent: Form initialized. Current value:', this.leaseUpdateForm.value);
  }

  loadLeaseDetails(id: number): void {
    console.log('LeaseUpdateComponent: Attempting to load lease details for ID:', id);
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.leaseService.getLeaseById(id).pipe(
      catchError(err => {
        this.error = `Failed to load lease details: ${err.message || 'An error occurred.'}`;
        console.error('LeaseUpdateComponent: Error fetching lease details:', err);
        alert(this.error);
        this.router.navigate(['/lease-management']);
        this.loading = false;
        return EMPTY;
      })
    ).subscribe((lease: Lease) => {
      console.log('LeaseUpdateComponent: Received lease data from service:', lease);
      if (lease) {
        // Log individual values before patching to ensure they are present
        console.log('LeaseUpdateComponent: Data before patchValue - Lease ID:', lease.leaseId);
        console.log('LeaseUpdateComponent: Data before patchValue - Property ID:', lease.propertyId);
        console.log('LeaseUpdateComponent: Data before patchValue - Tenant ID:', lease.tenantId);
        console.log('LeaseUpdateComponent: Data before patchValue - Owner ID:', lease.ownerId);
        console.log('LeaseUpdateComponent: Data before patchValue - Period:', lease.period);
        console.log('LeaseUpdateComponent: Data before patchValue - Start Date:', lease.startDate);
        console.log('LeaseUpdateComponent: Data before patchValue - End Date:', lease.endDate);
        console.log('LeaseUpdateComponent: Data before patchValue - Agreement Details:', lease.agreementDetails);
        console.log('LeaseUpdateComponent: Data before patchValue - Rent Amount:', lease.rentAmount);
        console.log('LeaseUpdateComponent: Data before patchValue - Lease Status:', lease.leaseStatus);


        this.leaseUpdateForm.patchValue({
          leaseId: lease.leaseId,
          propertyId: lease.propertyId,
          tenantId: lease.tenantId,
          ownerId: lease.ownerId,
          period: lease.period,
          startDate: lease.startDate,
          endDate: lease.endDate,
          agreementDetails: lease.agreementDetails,
          rentAmount: lease.rentAmount,
          leaseStatus: lease.leaseStatus
        });
        console.log('LeaseUpdateComponent: Form patched. Current form value (after patchValue):', this.leaseUpdateForm.getRawValue());
      } else {
        this.error = 'Lease not found or returned empty by service.';
        console.error('LeaseUpdateComponent: Lease data is null or undefined.');
        alert(this.error);
        this.router.navigate(['/lease-management']);
      }
      this.loading = false;
    });
  }

  onSubmit(): void {
    this.leaseUpdateForm.markAllAsTouched();
    if (this.leaseUpdateForm.invalid) {
      this.error = 'Please correct the errors in the form.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    if (this.leaseId === null) {
      this.error = 'Lease ID is missing. Cannot update lease.';
      this.loading = false;
      alert(this.error);
      return;
    }

    const formValue = this.leaseUpdateForm.getRawValue(); // Use getRawValue to get disabled fields too

    const payload: LeaseUpdatePayload = {
      period: formValue.period, // Now directly assigned as number
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      agreementDetails: formValue.agreementDetails,
      rentAmount: formValue.rentAmount,
      leaseStatus: formValue.leaseStatus
    };

    console.log('LeaseUpdateComponent: Submitting update for lease ID:', this.leaseId, 'with payload:', payload);

    this.leaseService.updateLease(this.leaseId, payload).subscribe({
      next: (response) => {
        this.successMessage = 'Lease updated successfully!';
        console.log('Lease updated:', response);
        alert(this.successMessage);
        this.router.navigate(['/lease-management']);
      },
      error: (err) => {
        this.error = `Failed to update lease: ${err.message || err.error || 'An unknown error occurred.'}`;
        console.error('LeaseUpdateComponent: Error updating lease:', err);
        alert(this.error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/lease-management']);
  }

  // Helper for displaying form control errors
  getFormControl(name: string) {
    return this.leaseUpdateForm.get(name);
  }
}
