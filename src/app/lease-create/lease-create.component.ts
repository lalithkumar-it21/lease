// src/app/lease-create/lease-create.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaseService, LeaseCreatePayload } from '../lease.service'; // Import LeaseService and payload
import { Property, Tenant, Owner } from '../registerservice.service'; // For dropdown data
import { PropertyUpdateService } from '../property-update.service'; // To fetch properties
import { TenantUpdateService } from '../tenant-update.service'; // To fetch tenants
import { OwnersService } from '../owners.service'; // To fetch owners
import { catchError, EMPTY, forkJoin } from 'rxjs';

@Component({
  selector: 'app-lease-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lease-create.component.html',
  styleUrls: ['./lease-create.component.css']
})
export class LeaseCreateComponent implements OnInit {
  leaseCreateForm: FormGroup;
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  properties: Property[] = [];
  tenants: Tenant[] = [];
  owners: Owner[] = [];
  leaseStatuses: ('ACTIVE' | 'EXTENDED' | 'TERMINATED')[] = ['ACTIVE', 'EXTENDED', 'TERMINATED'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private leaseService: LeaseService,
    private propertyService: PropertyUpdateService,
    private tenantService: TenantUpdateService,
    private ownerService: OwnersService // Use OwnersService for admin-level owner fetching
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownData();
  }

  initForm(): void {
    this.leaseCreateForm = this.fb.group({
      propertyId: ['', [Validators.required, Validators.min(1)]],
      tenantId: ['', [Validators.required, Validators.min(1)]],
      ownerId: ['', [Validators.required, Validators.min(1)]],
      period: ['', [Validators.required, Validators.min(1)]], // Period is now number
      startDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]], // DD/MM/YYYY
      endDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]], // DD/MM/YYYY
      agreementDetails: ['', [Validators.required, Validators.minLength(5)]],
      rentAmount: ['', [Validators.required, Validators.min(1)]],
      leaseStatus: ['ACTIVE', Validators.required]
    });
  }

  loadDropdownData(): void {
    this.loading = true;
    forkJoin([
      this.propertyService.fetchAllProperties().pipe(catchError(err => { console.error('Error fetching properties:', err); return EMPTY; })),
      this.tenantService.getAllTenants().pipe(catchError(err => { console.error('Error fetching tenants:', err); return EMPTY; })), // Assuming getAllTenants exists
      this.ownerService.getAllOwners().pipe(catchError(err => { console.error('Error fetching owners:', err); return EMPTY; }))
    ]).subscribe({
      next: ([properties, tenants, owners]) => {
        this.properties = properties;
        this.tenants = tenants;
        this.owners = owners;
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load necessary data for dropdowns: ${err.message || 'An error occurred.'}`;
        console.error('LeaseCreateComponent: Dropdown data load error:', err);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.leaseCreateForm.markAllAsTouched();
    if (this.leaseCreateForm.invalid) {
      this.error = 'Please correct the errors in the form.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const formValue = this.leaseCreateForm.value;

    const payload: LeaseCreatePayload = {
      propertyId: formValue.propertyId,
      tenantId: formValue.tenantId,
      ownerId: formValue.ownerId,
      period: formValue.period, // Now directly assigned as number
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      agreementDetails: formValue.agreementDetails,
      rentAmount: formValue.rentAmount,
      leaseStatus: formValue.leaseStatus
    };

    this.leaseService.createLease(payload).subscribe({
      next: (response) => {
        this.successMessage = 'Lease created successfully!';
        console.log('Lease created:', response);
        // Using alert() as per previous code context, consider a modal or toast.
        alert(this.successMessage);
        this.router.navigate(['/lease-management']); // Redirect to lease management
      },
      error: (err) => {
        this.error = `Failed to create lease: ${err.message || err.error || 'An unknown error occurred.'}`;
        console.error('LeaseCreateComponent: Error creating lease:', err);
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
    return this.leaseCreateForm.get(name);
  }
}
