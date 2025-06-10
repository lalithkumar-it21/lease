// src/app/property-update/property-update.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute to get ID from URL
import { CommonModule } from '@angular/common';
import { Property } from '../registerservice.service'; // Import Property interface
import { PropertyUpdatePayload, PropertyUpdateService } from '../property-update.service'; // Import new service and payload
import { catchError, EMPTY } from 'rxjs'; // RxJS operators
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'property-update',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './property-update.component.html',
  styleUrls: ['./property-update.component.css']
})
export class PropertyUpdateComponent implements OnInit {
  propertyUpdateForm: FormGroup;
  propertyId: number | null = null; // Stores propertyId from the route parameter
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
    private route: ActivatedRoute, // To read URL parameters
    private router: Router,
    private propertyUpdateService: PropertyUpdateService // Custom service for property updates
  ) { }

  ngOnInit(): void {
    // Initialize the form with validators and disabled fields for IDs
    this.propertyUpdateForm = this.fb.group({
      propertyId: [{ value: '', disabled: true }], // Display, not editable
      ownerId: [{ value: '', disabled: true }, Validators.required], // Display, not editable (fetched from existing data)
      propertyName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      rentAmount: ['', [Validators.required, Validators.min(1)]],
      period: ['', [Validators.required, Validators.min(1)]],
      image: ['', [Validators.required, Validators.pattern(/^(ftp|http|https):\/\/[^ "]+$/)]], // Basic URL validation
      propertyDetails: ['', [Validators.required, Validators.minLength(10)]],
      availabilityStatus: ['', Validators.required] // Dropdown
    });

    // Subscribe to route parameters to get the propertyId
    this.route.paramMap.subscribe(params => {
      const id = params.get('propertyId'); // 'id' must match the route path variable '/property-update/:id'
      if (id) {
        this.propertyId = +id; // Convert string to number
        this.loadPropertyDetails(this.propertyId);
      } else {
        // If no propertyId is found in the URL, show an error and redirect
        this.error = 'No property ID provided in the URL. Cannot update property.';
        // Using alert() is generally not recommended in Angular for better UX,
        // but it's used here as per previous code context. Consider a modal or toast.
        alert(this.error);
        this.router.navigate(['/owner-property']); // Redirect to property list or owner's property list
      }
    });
  }

  /**
   * Fetches property details by ID and patches the form.
   * @param id The ID of the property to load.
   */
  loadPropertyDetails(id: number): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.propertyUpdateService.fetchPropertyById(id).pipe(
      catchError(err => {
        // Handle errors during fetching property data
        this.error = `Failed to load property details: ${err.message || 'An error occurred.'}`;
        console.error('PropertyUpdateComponent: Error fetching property details:', err);
        alert(this.error);
        this.router.navigate(['/owner-property']); // Redirect on fetch error
        this.loading = false;
        return EMPTY; // Stop the observable chain
      })
    ).subscribe({
      next: (property: Property) => {
        console.log('PropertyUpdateComponent: Received property details:', property);
        // Ensure the fetched property object and its IDs are valid
        if (property && typeof property.propertyId === 'number' && property.propertyId > 0 &&
            typeof property.ownerId === 'number' && property.ownerId > 0) {
          // Patch form values using the received property data
          this.propertyUpdateForm.patchValue({
            propertyId: property.propertyId,
            ownerId: property.ownerId, // Set ownerId from fetched data (will be disabled)
            propertyName: property.propertyName,
            address: property.address,
            rentAmount: property.rentAmount,
            period: property.period,
            image: property.image,
            propertyDetails: property.propertyDetails,
            availabilityStatus: property.availabilityStatus
          });
          console.log('PropertyUpdateComponent: Form patched with:', this.propertyUpdateForm.getRawValue());
        } else {
          // Handle invalid or missing property/owner IDs in the fetched data
          this.error = 'Invalid property or owner ID found in fetched data. Cannot display details.';
          console.error('PropertyUpdateComponent: Invalid property object received:', property);
          alert(this.error);
          this.router.navigate(['/owner-property']); // Redirect if data is invalid
        }
        this.loading = false; // Reset loading state
      },
      complete: () => {
        this.loading = false; // Ensure loading is reset on completion
      }
    });
  }

  /**
   * Handles form submission for updating a property.
   */
  onSubmit(): void {
    this.propertyUpdateForm.markAllAsTouched(); // Mark all fields to show validation errors
    if (this.propertyUpdateForm.invalid) {
      this.error = 'Please correct the errors in the form.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    // Ensure propertyId is available for the update request
    if (this.propertyId === null) {
      this.error = 'Property ID is missing. Cannot update property.';
      this.loading = false;
      alert(this.error);
      console.error('PropertyUpdateComponent: onSubmit - propertyId is null.');
      return;
    }

    // Use getRawValue() to include values from disabled fields (propertyId, ownerId)
    const formValue = this.propertyUpdateForm.getRawValue();

    // Construct the payload as required by the backend's PUT /property/update/{id} endpoint
    const updatedPropertyPayload: PropertyUpdatePayload = {
      propertyName: formValue.propertyName,
      ownerId: formValue.ownerId, // This is explicitly included in the payload
      address: formValue.address,
      rentAmount: formValue.rentAmount,
      period: formValue.period,
      image: formValue.image,
      propertyDetails: formValue.propertyDetails,
      availabilityStatus: formValue.availabilityStatus
    };

    console.log('PropertyUpdateComponent: Submitting update for property ID:', this.propertyId, 'with payload:', updatedPropertyPayload);

    this.propertyUpdateService.updateProperty(this.propertyId, updatedPropertyPayload).subscribe({
      next: (response) => {
        this.successMessage = 'Property updated successfully!';
        console.log('Property updated:', response);
        alert(this.successMessage);



if (typeof response === 'string') {
  //response=AdminHomeComponent;
  const decoded = jwtDecode<JwtPayload>(response);
  const roles: string = decoded.roles ?? 'No role found';
  console.log("Decoded Roles:", roles);

  sessionStorage.setItem("role", roles); // Current: keeps role only for session

  const role = roles.toLowerCase();
  if (role === 'owner') {
    this.router.navigate(['/owner-property']);
  }
  else if (role === 'admin') {
    this.router.navigate(['/admin-property']);
  }
} else {
  console.error('PropertyUpdateComponent: Response is not a valid JWT string:', response);
  //this.error = 'Invalid response received. Cannot decode roles.';
}
        //     const roles: string = decoded.roles ?? 'No role found';
        //     console.log("Decoded Roles:", roles);

        //     // Consider using localStorage for role if it needs to persist
        //     // localStorage.setItem("role", roles); // Option to store role persistently
        //     sessionStorage.setItem("role", roles); // Current: keeps role only for session

        //     const role = roles.toLowerCase();
        //     if (role === 'owner') {
        //       //this.router.navigate(["/owner-home"]);


        // this.router.navigate(['/ADMIN-property']); }// Navigate back to properties list after success
      },
      error: (err) => {
        this.error = `Failed to update property: ${err.message || err.error || 'An unknown error occurred.'}`;
        console.error('PropertyUpdateComponent: Error updating property:', err);
        alert(this.error);
      },
      complete: () => {
        this.loading = false; // Reset loading state
      }
    });
  }

  /**
   * Resets the form by reloading the original property details.
   */
  onReset(): void {
    if (this.propertyId) {
      this.loadPropertyDetails(this.propertyId); // Re-load original data if propertyId exists
    }
    this.propertyUpdateForm.markAsUntouched(); // Clear touched state
    this.error = null;
    this.successMessage = null;
  }
}
interface JwtPayload {
  roles?: string;
  sub?: string;
  iat?: number;
  exp?: number;
}