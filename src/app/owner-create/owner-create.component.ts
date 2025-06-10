import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Owner } from '../registerservice.service'; // Import Owner interface
import { OwnersService } from '../owners.service'; // Import OwnerService
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'owner-create',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule, HttpClientModule],
  templateUrl: './owner-create.component.html',
  styleUrls: ['./owner-create.component.css']
})
export class OwnerCreateComponent implements OnInit {
  newOwner: Omit<Owner, 'ownerId'> = {
    name: '',
    email: '',
    contact: '',
    address: ''
  };
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private ownersService: OwnersService,
    private router: Router
  ) { }

  ngOnInit(): void { }

  onSubmit(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.ownersService.createOwner(this.newOwner).pipe(
      catchError(err => {
        this.error = `Failed to create owner: ${err.message || 'An error occurred.'}`;
        console.error('Error creating owner:', err);
        this.loading = false;
        return of(null); // Return null to complete the observable without error
      })
    ).subscribe(response => {
      if (response) {
        this.successMessage = 'Owner created successfully!';
        console.log('Owner created:', response);
        // Navigate back to the owner list or a success page after a delay
      
          this.router.navigate(['/owners']);
        
      }
      this.loading = false;
    });
  }
}