// src/app/admin-home/admin-home.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AdminDashboardService } from '../admin-dashboard.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common'; // <--- IMPORT THIS LINE

@Component({
  selector: 'admin-home',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    HttpClientModule,
    CommonModule // <--- ADD CommonModule HERE
  ],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent implements OnInit {
  totalProperties: number | string = '...';
  totalLeases: number | string = '...';
  totalOwners: number | string = '...';
  totalTenants: number | string = '...';
  totalUsers: number | string = '...';

  loadingCounts: boolean = true;
  errorMessage: string | null = null;

  constructor(
    private adminDashboardService: AdminDashboardService
  ) { }

  ngOnInit(): void {
    this.fetchDashboardCounts();
  }

  fetchDashboardCounts(): void {
    this.loadingCounts = true;
    this.errorMessage = null;

    forkJoin({
      properties: this.adminDashboardService.getTotalProperties().pipe(
        catchError(err => {
          console.error('Error fetching total properties:', err);
          return of('N/A');
        })
      ),
      leases: this.adminDashboardService.getTotalLeases().pipe(
        catchError(err => {
          console.error('Error fetching total leases:', err);
          return of('N/A');
        })
      ),
      owners: this.adminDashboardService.getTotalOwners().pipe(
        catchError(err => {
          console.error('Error fetching total owners:', err);
          return of('N/A');
        })
      ),
      tenants: this.adminDashboardService.getTotalTenants().pipe(
        catchError(err => {
          console.error('Error fetching total tenants:', err);
          return of('N/A');
        })
      )
    }).subscribe({
      next: (results) => {
        this.totalProperties = results.properties;
        this.totalLeases = results.leases;
        this.totalOwners = results.owners;
        this.totalTenants = results.tenants;

        let ownerCount = typeof results.owners === 'number' ? results.owners : 0;
        let tenantCount = typeof results.tenants === 'number' ? results.tenants : 0;
        this.totalUsers = ownerCount + tenantCount;

        this.loadingCounts = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load some dashboard data. Check console for details.';
        this.loadingCounts = false;
        console.error('Overall dashboard data fetch error:', err);
      },
      complete: () => {
        this.loadingCounts = false;
      }
    });
  }
}
