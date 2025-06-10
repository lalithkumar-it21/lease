// src/app/admin-tenant/admin-tenant.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminTenantService } from '../admin-tenant.service';
import { Tenant } from '../registerservice.service'; // Reusing Tenant interface
import { HttpClientModule } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../auth.service'; // For role check

@Component({
  selector: 'admin/tenant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule // Needed for the service
  ],
  templateUrl: './admin-tenant.component.html',
  styleUrls: ['./admin-tenant.component.css']
})
export class AdminTenantComponent implements OnInit {
  allTenants: Tenant[] = [];
  filteredTenants: Tenant[] = [];
  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  filterForm: FormGroup;

  // Modals for Edit and Delete Confirmation
  showEditModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  selectedTenantForEdit: Tenant | null = null;
  tenantToDeleteId: number | null = null;
  
  editTenantForm: FormGroup;

  // Custom Modal for Messages (replaces alert/confirm)
  showCustomMessageModal: boolean = false;
  customMessageTitle: string = '';
  customMessageContent: string = '';
  customMessageType: 'success' | 'error' | 'info' | 'confirm' = 'info';
  confirmAction: (() => void) | null = null; // Callback for confirm type modal

  constructor(
    private adminTenantService: AdminTenantService,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      email: [''],
      contact: [''],
      address: ['']
    });

    this.editTenantForm = this.fb.group({
      tenantId: [{ value: '', disabled: true }], // Disabled
      name: [{ value: '', disabled: true }],     // Disabled
      email: ['', [Validators.required, Validators.email]],
      contact: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]], // 10 digit number
      address: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.error = 'Access Denied: Only administrators can view this page.';
      return;
    }
    this.fetchAllTenants();
    this.setupFilterFormListener();
  }

  setupFilterFormListener(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(300), // Wait for 300ms after the last keystroke
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)) // Only emit if distinct
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  fetchAllTenants(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.adminTenantService.fetchAllTenants().subscribe({
      next: (data: Tenant[]) => {
        this.allTenants = data;
        this.applyFilters(); // Apply filters immediately after fetching
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to fetch tenants: ${err.message || 'An error occurred.'}`;
        this.loading = false;
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    let currentTenants = [...this.allTenants];
    const { name, email, contact, address } = this.filterForm.value;

    if (name) {
      currentTenants = currentTenants.filter(t => t.name?.toLowerCase().includes(name.toLowerCase()));
    }
    if (email) {
      currentTenants = currentTenants.filter(t => t.email?.toLowerCase().includes(email.toLowerCase()));
    }
    if (contact) {
      currentTenants = currentTenants.filter(t => t.contact?.includes(contact));
    }
    if (address) {
      currentTenants = currentTenants.filter(t => t.address?.toLowerCase().includes(address.toLowerCase()));
    }

    this.filteredTenants = currentTenants;
  }

  onResetFilters(): void {
    this.filterForm.reset({
      name: '', email: '', contact: '', address: ''
    });
    this.applyFilters(); // Will apply filters with empty values, showing all
  }

  // --- Edit Tenant Functionality ---

  openEditModal(tenant: Tenant): void {
    this.selectedTenantForEdit = { ...tenant }; // Create a copy to avoid direct mutation
    this.editTenantForm.patchValue(this.selectedTenantForEdit);
    this.showEditModal = true;
    this.error = null; // Clear previous errors
    this.successMessage = null; // Clear previous success messages
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedTenantForEdit = null;
    this.editTenantForm.reset(); // Reset form state
    this.error = null;
    this.successMessage = null;
  }

  onUpdateTenant(): void {
    if (this.editTenantForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      this.editTenantForm.markAllAsTouched(); // Show validation errors
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    // Get the original tenantId from selectedTenantForEdit, as it's disabled in form
    const tenantIdToUpdate = this.selectedTenantForEdit?.tenantId;
    if (!tenantIdToUpdate) {
      this.error = 'Tenant ID for update is missing.';
      this.loading = false;
      return;
    }

    // Get only the updatable values from the form, along with disabled ones (name, id)
    // We send the full Tenant object as the backend might expect it.
    const updatedTenantData: Tenant = {
      tenantId: tenantIdToUpdate,
      name: this.selectedTenantForEdit?.name || '', // Keep original name as it's disabled
      email: this.editTenantForm.get('email')?.value,
      contact: this.editTenantForm.get('contact')?.value,
      address: this.editTenantForm.get('address')?.value
    };

    this.adminTenantService.updateTenant(tenantIdToUpdate, updatedTenantData).subscribe({
      next: (response: Tenant) => {
        this.successMessage = `Tenant '${response.name}' (ID: ${response.tenantId}) updated successfully!`;
        this.fetchAllTenants(); // Refresh the list
        this.closeEditModal();
        this.showCustomMessage('Success', this.successMessage, 'success');
      },
      error: (err) => {
        this.error = `Failed to update tenant: ${err.message || 'An error occurred.'}`;
        console.error(err);
        this.showCustomMessage('Error', this.error, 'error');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // --- Delete Tenant Functionality ---

  openDeleteConfirmModal(tenantId: number): void {
    this.tenantToDeleteId = tenantId;
    this.showCustomMessage(
      'Confirm Deletion',
      'Are you sure you want to delete this tenant? This action cannot be undone.',
      'confirm',
      () => this.onDeleteTenantConfirmed()
    );
  }

  onDeleteTenantConfirmed(): void {
    if (this.tenantToDeleteId === null) {
      this.showCustomMessage('Error', 'No tenant selected for deletion.', 'error');
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;
    this.showCustomMessageModal = false; // Close the confirmation modal

    this.adminTenantService.deleteTenant(this.tenantToDeleteId).subscribe({
      next: (response: string) => {
        this.successMessage = `Tenant (ID: ${this.tenantToDeleteId}) deleted successfully!`;
        this.fetchAllTenants(); // Refresh the list
        this.showCustomMessage('Success', this.successMessage, 'success');
        this.tenantToDeleteId = null; // Clear selected ID
      },
      error: (err) => {
        this.error = `Failed to delete tenant: ${err.message || 'An error occurred.'}`;
        console.error(err);
        this.showCustomMessage('Error', this.error, 'error');
        this.tenantToDeleteId = null; // Clear selected ID
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // --- Custom Message Modal (Replaces alert/confirm) ---

  showCustomMessage(title: string, content: string, type: 'success' | 'error' | 'info' | 'confirm', confirmCallback?: () => void): void {
    this.customMessageTitle = title;
    this.customMessageContent = content;
    this.customMessageType = type;
    this.confirmAction = confirmCallback || null;
    this.showCustomMessageModal = true;
  }

  closeCustomMessageModal(): void {
    this.showCustomMessageModal = false;
    this.confirmAction = null; // Clear callback
  }

  executeConfirmAction(): void {
    if (this.confirmAction) {
      this.confirmAction();
    }
    this.closeCustomMessageModal();
  }

}
