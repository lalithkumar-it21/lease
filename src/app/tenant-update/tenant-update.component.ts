// src/app/tenant-update/tenant-update.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TenantUpdateService, TenantUpdatePayload } from '../tenant-update.service';
import { Tenant } from '../registerservice.service'; // Re-use the Tenant interface
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { switchMap, catchError, EMPTY } from 'rxjs'; // Import switchMap

@Component({
  selector: 'app-tenant-update',
  templateUrl: './tenant-update.component.html',
  styleUrls: ['./tenant-update.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class TenantUpdateComponent implements OnInit {
  tenantUpdateForm: FormGroup;
  currentTenantName: string | null = null;
  currentTenantId: number | null = null; // Store the tenantId from the fetched data
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private tenantUpdateService: TenantUpdateService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.tenantUpdateForm = this.fb.group({
      tenantId: [{ value: '', disabled: true }],
      name: [{ value: '', disabled: true }],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.initTenantDetails(); // Load current tenant's data
  }

  initTenantDetails(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.currentTenantName = this.authService.getUsernameFromToken();
    console.log('TenantUpdateComponent: initTenantDetails - Username from token:', this.currentTenantName);

    if (!this.currentTenantName) {
      this.error = 'You are not logged in or your session has expired. Please log in again.';
      console.error('TenantUpdateComponent: initTenantDetails - No username found from token.');
      alert(this.error);
      this.router.navigate(['/login']);
      this.loading = false;
      return;
    }

    // --- Start of chained calls ---
    this.tenantUpdateService.getTenantIdByUsername(this.currentTenantName).pipe(
      switchMap(tenantId => {
        // After successfully getting the tenantId, use it to fetch the full details
        if (tenantId === null || tenantId === undefined || tenantId <= 0) {
          throw new Error('Invalid tenant ID received after lookup.');
        }
        this.currentTenantId = tenantId; // Store the ID for later update
        return this.tenantUpdateService.getTenantDetailsById(tenantId);
      }),
      catchError(err => {
        this.error = `Failed to load tenant details: ${err.message || 'An error occurred.'}`;
        console.error('TenantUpdateComponent: initTenantDetails - Error in chained fetch:', err);
        alert(this.error);
        this.router.navigate(['/login']);
        this.loading = false;
        return EMPTY; // Stop the observable chain
      })
    ).subscribe({
      next: (tenant: Tenant) => {
        console.log('TenantUpdateComponent: initTenantDetails - Received full tenant object in component:', tenant);
        // We already checked tenantId in switchMap, but a final check is good.
        if (tenant && typeof tenant.tenantId === 'number' && tenant.tenantId > 0) {
          // patchValue will only update fields that exist in the form group
          this.tenantUpdateForm.patchValue({
            tenantId: tenant.tenantId, // This is explicitly shown now
            name: tenant.name,         // This is explicitly shown now
            email: tenant.email,
            contact: tenant.contact,
            address: tenant.address
          });
          console.log('TenantUpdateComponent: initTenantDetails - Form patched with:', this.tenantUpdateForm.value);
        } else {
          this.error = 'Tenant ID not found or is invalid in fetched profile data. Cannot display profile.';
          console.error('TenantUpdateComponent: initTenantDetails - Full tenant object is invalid:', tenant);
          alert(this.error);
          this.router.navigate(['/login']);
        }
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
    // --- End of chained calls ---
  }

  onSubmit(): void {
    this.tenantUpdateForm.markAllAsTouched();
    if (this.tenantUpdateForm.invalid) {
      this.error = 'Please correct the errors in the form.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    if (this.currentTenantId === null) {
      this.error = 'Tenant ID is missing. Cannot update profile.';
      this.loading = false;
      alert(this.error);
      console.error('TenantUpdateComponent: onSubmit - currentTenantId is null, cannot proceed with update.');
      return;
    }

    const formValue = this.tenantUpdateForm.getRawValue();

    const requestBody: TenantUpdatePayload = {
      name: formValue.name,      // Include name, as per your Postman example
      email: formValue.email,
      contact: formValue.contact,
      address: formValue.address
    };

    console.log('TenantUpdateComponent: onSubmit - Sending update request for tenantId:', this.currentTenantId, 'with payload:', requestBody);

    this.tenantUpdateService.updateTenant(this.currentTenantId, requestBody).subscribe({
      next: (response) => {
        this.successMessage = 'Profile updated successfully!';
        console.log('TenantUpdateComponent: onSubmit - Tenant updated successfully:', response);
        alert(this.successMessage);
        this.router.navigate(["/tenant-home"]);
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to update profile: ${err.message || err.error || 'An error occurred.'}`;
        console.error('TenantUpdateComponent: onSubmit - Error updating tenant:', err);
        alert(this.error);
        this.loading = false;
      }
    });
  }

  onReset(): void {
    this.initTenantDetails();
    this.tenantUpdateForm.markAsUntouched();
    this.error = null;
    this.successMessage = null;
  }
}