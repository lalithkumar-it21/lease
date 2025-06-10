import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Owner } from '../registerservice.service'; // Import Owner interface
import { OwnersService } from '../owners.service'; // Import OwnerService
import { catchError } from 'rxjs/operators';
import { of, EMPTY } from 'rxjs'; // Import EMPTY

@Component({
  selector: 'admin-owner-update',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './admin-owner-update.component.html',
  styleUrls: ['./admin-owner-update.component.css']
})
export class OwnerUpdatedComponent implements OnInit {
  ownerId: number | null = null;
  owner: Owner | null = null;
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private route: ActivatedRoute, // To get route parameters
    private router: Router,
    private ownersService: OwnersService
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.route.paramMap.subscribe(params => {
      const id = params.get('ownerId'); // 'id' should match the route parameter name
      if (id) {
        this.ownerId = +id; // Convert string to number
        this.fetchOwnerDetails(this.ownerId);
      } else {
        this.error = 'Owner ID not provided in route.';
        this.loading = false;
      }
    });
  }

  fetchOwnerDetails(id: number): void {
    this.ownersService.getOwnerById(id).pipe(
      catchError(err => {
        this.error = `Failed to load owner details: ${err.message || 'An error occurred.'}`;
        console.error('Error fetching owner details:', err);
        this.loading = false;
        return EMPTY; // Stop the observable chain
      })
    ).subscribe(ownerData => {
      this.owner = ownerData;
      this.loading = false;
    });
  }

  onSubmit(): void {
    if (!this.owner || this.ownerId === null) {
      this.error = 'Owner data is missing or invalid.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.ownersService.updateOwner(this.ownerId, this.owner).pipe(
      catchError(err => {
        this.error = `Failed to update owner: ${err.message || 'An error occurred.'}`;
        console.error('Error updating owner:', err);
        this.loading = false;
        return of(null); // Return null to complete the observable without error
      })
    ).subscribe(response => {
      if (response) {
        this.successMessage = 'Owner updated successfully!';
        console.log('Owner updated:', response);
        setTimeout(() => {
          this.router.navigate(['/owners']); // Navigate back to the owner list
        }, 2000);
      }
      this.loading = false;
    });
  }
}