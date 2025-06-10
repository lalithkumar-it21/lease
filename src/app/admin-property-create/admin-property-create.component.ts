// src/app/admin-property-create/admin-property-create.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyUpdateService, PropertyUpdatePayload } from '../property-update.service'; // Using PropertyUpdateService for creation
import { Owner } from '../registerservice.service'; // To get owner details for display
import { OwnersService } from '../owners.service'; // To fetch owner details by ID
import { catchError, EMPTY } from 'rxjs';

@Component({
  selector: 'admin/property-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-property-create.component.html',
  styleUrls: ['./admin-property-create.component.css']
})
export class AdminPropertyCreateComponent implements OnInit {
  propertyCreateForm: FormGroup;
  ownerId: number | null = null;
  ownerName: string | null = null; // To display owner's name
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  availabilityStatuses: ('AVAILABLE' | 'OCCUPIED' | 'UNDER_MAINTENANCE')[] = [
    'AVAILABLE',
    'OCCUPIED',
    'UNDER_MAINTENANCE'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyUpdateService, // Use this for property creation
    private ownersService: OwnersService // To fetch owner details
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      const id = params.get('ownerId'); // 'ownerId' must match the route parameter name
      if (id) {
        this.ownerId = +id; // Convert string to number
        this.loadOwnerDetails(this.ownerId); // Load owner details to display name
        this.propertyCreateForm.get('ownerId')?.setValue(this.ownerId); // Set ownerId in form
      } else {
        this.error = 'Owner ID not provided in URL. Cannot create property.';
        alert(this.error);
        this.router.navigate(['/admin/owners']); // Redirect back to owner list
      }
    });
  }

  initForm(): void {
    this.propertyCreateForm = this.fb.group({
      ownerId: [{ value: '', disabled: true }, Validators.required], // Auto-filled from URL, disabled
      propertyName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      rentAmount: ['', [Validators.required, Validators.min(1)]],
      period: ['', [Validators.required, Validators.min(1)]], // Period is number
      image: ['', [Validators.required, Validators.pattern(/^(ftp|http|https):\/\/[^ "]+$/)]], // Basic URL validation
      propertyDetails: ['', [Validators.required, Validators.minLength(10)]],
      availabilityStatus: ['AVAILABLE', Validators.required] // Default to AVAILABLE
    });
  }

  /**
   * Fetches owner details to display their name in the form.
   * @param id The owner ID.
   */
  loadOwnerDetails(id: number): void {
    this.ownersService.getOwnerById(id).pipe(
      catchError(err => {
        this.error = `Failed to load owner details: ${err.message || 'An error occurred.'}`;
        console.error('AdminPropertyCreateComponent: Error fetching owner details:', err);
        // Do not redirect on owner details fetch error, allow user to continue if ownerId is valid
        return EMPTY;
      })
    ).subscribe((owner: Owner) => {
      if (owner) {
        this.ownerName = owner.name;
        console.log(`AdminPropertyCreateComponent: Fetched owner name: ${owner.name} for ID: ${id}`);
      } else {
        this.error = `Owner with ID ${id} not found.`;
        console.error(`AdminPropertyCreateComponent: Owner with ID ${id} not found.`);
      }
    });
  }

  onSubmit(): void {
    this.propertyCreateForm.markAllAsTouched();
    if (this.propertyCreateForm.invalid) {
      this.error = 'Please correct the errors in the form.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    if (this.ownerId === null) {
      this.error = 'Owner ID is missing. Cannot create property.';
      this.loading = false;
      alert(this.error);
      return;
    }

    // Use getRawValue() to include the disabled ownerId
    const formValue = this.propertyCreateForm.getRawValue();

    const payload: PropertyUpdatePayload = {
      propertyName: formValue.propertyName,
      ownerId: formValue.ownerId, // This is the auto-filled, disabled ownerId
      address: formValue.address,
      rentAmount: formValue.rentAmount,
      period: formValue.period,
      image: formValue.image,
      propertyDetails: formValue.propertyDetails,
      availabilityStatus: formValue.availabilityStatus
    };

    console.log('AdminPropertyCreateComponent: Submitting property creation with payload:', payload);

    this.propertyService.createProperty(payload).subscribe({
      next: (response) => {
        this.successMessage = 'Property created successfully!';
        console.log('Property created:', response);
        alert(this.successMessage);
        this.router.navigate(['/admin/owners']); // Redirect back to admin owners list
      },
      error: (err) => {
        this.error = `Failed to create property: ${err.message || err.error || 'An unknown error occurred.'}`;
        console.error('AdminPropertyCreateComponent: Error creating property:', err);
        alert(this.error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/owners']); // Navigate back to the admin owners list
  }

  // Helper for displaying form control errors
  getFormControl(name: string) {
    return this.propertyCreateForm.get(name);
  }
}
