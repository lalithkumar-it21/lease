import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Owner } from '../registerservice.service'; // Reusing Owner interface
import { OwnerUpdateService } from '../owner-update.service';
import { LoginserviceService } from '../loginservice.service';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode

@Component({
  selector: 'owner-update',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './owner-update.component.html',
  styleUrls: ['./owner-update.component.css']
})
export class OwnerUpdateProfileComponent implements OnInit {
  ownerUpdateForm: FormGroup;
  currentOwnerId: number; // Will hold the owner's ID from the token

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private ownerUpdateService: OwnerUpdateService,
    private loginService: LoginserviceService
  ) { }

  ngOnInit(): void {
    this.ownerUpdateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(15)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]], // Email usually not editable
      contact: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]]
    });

    // 1. Get the JWT token from localStorage
    const token = this.loginService.getJWT();

    if (token) {
      try {
        // 2. Decode the token to get the owner's ID and email
        const decodedToken: any = jwtDecode(token);

        // *** IMPORTANT: Assuming your JWT payload contains 'ownerId' and 'sub' (for email) ***
        // You MUST ensure your Spring Boot JWT generation adds ownerId to the token claims.
        this.currentOwnerId = decodedToken.ownerId; // Get ownerId directly from token
        const ownerEmailFromToken = decodedToken.sub; // Still useful for initial pre-fill, if needed

        if (this.currentOwnerId) {
          // 3. Use the extracted ownerId to fetch the profile data
          this.ownerUpdateService.getOwnerProfile(this.currentOwnerId).subscribe({
            next: (ownerData) => {
              if (ownerData) {
                this.ownerUpdateForm.patchValue({
                  name: ownerData.name,
                  email: ownerData.email,
                  contact: ownerData.contact,
                  address: ownerData.address
                });
              } else {
                console.warn('Owner data not found for ID:', this.currentOwnerId);
                alert('Could not load profile data.');
              }
            },
            error: (err) => {
              console.error('Error fetching owner profile:', err);
              alert('Failed to load profile data. Please try again later.');
            }
          });
        } else {
          console.error('Owner ID not found in JWT token.');
          alert('User ID missing from authentication token. Please log in again.');
          this.router.navigate(['/login']);
        }

      } catch (error) {
        console.error('Error decoding token or token invalid:', error);
        alert('Authentication error. Please log in again.');
        this.router.navigate(['/login']); // Redirect to login on token error
      }
    } else {
      alert('No authentication token found. Please log in.');
      this.router.navigate(['/login']); // Redirect to login if no token
    }
  }

  onReset(): void {
    // Re-fetch data to reset the form to its original fetched state
    if (this.currentOwnerId) {
      this.ownerUpdateService.getOwnerProfile(this.currentOwnerId).subscribe({
        next: (ownerData) => {
          if (ownerData) {
            this.ownerUpdateForm.patchValue({
              name: ownerData.name,
              email: ownerData.email,
              contact: ownerData.contact,
              address: ownerData.address
            });
          }
        },
        error: (err) => {
          console.error('Error resetting form, fetching original profile:', err);
          alert('Could not reset form to original data. Please try again.');
        }
      });
    } else {
      alert('Owner ID not available. Cannot reset form.');
    }
  }

  submitUpdate(): void {
    this.ownerUpdateForm.markAllAsTouched();

    if (this.ownerUpdateForm.invalid) {
      alert('Please correct the errors in the form before submitting.');
      return;
    }

    const updatedOwner: Partial<Owner> = {
      name: this.ownerUpdateForm.get('name').value,
      contact: this.ownerUpdateForm.get('contact').value,
      address: this.ownerUpdateForm.get('address').value,
    };

    if (this.currentOwnerId) {
      this.ownerUpdateService.updateOwnerProfile(this.currentOwnerId, updatedOwner).subscribe({
        next: (response) => {
          console.log('Owner profile updated successfully:', response);
          alert('Profile updated successfully!');
          this.ngOnInit(); // Refresh data
        },
        error: (err) => {
          console.error('Failed to update owner profile:', err);
          alert('Failed to update profile. Please try again.');
        }
      });
    } else {
      alert('Owner ID not available. Cannot update profile.');
    }
  }
}