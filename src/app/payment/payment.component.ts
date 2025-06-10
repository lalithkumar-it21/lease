// src/app/payment/payment.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Import DatePipe
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { OrderCreateRequest, OrderCreateResponse, PaymentService } from '../payment.service';
import { LeaseService, LeaseCreatePayload } from '../lease.service';
import { Property, Tenant, Owner } from '../registerservice.service';
import { AuthService } from '../auth.service';
import { TenantUpdateService } from '../tenant-update.service';
import { PropertyUpdateService } from '../property-update.service';
import { OwnersService } from '../owners.service'; // To get owner name for display
import { forkJoin, EMPTY, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

// Declare Razorpay globally to avoid TypeScript errors
declare var Razorpay: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule], // DatePipe removed from imports here
  providers: [DatePipe], // <--- NEW: Provide DatePipe here for injection
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  propertyId: number | null = null;
  ownerId: number | null = null;
  tenantId: number | null = null;
  rentAmount: number | null = null;
  period: number | null = null; // Period in months

  propertyDetails: Property | null = null;
  tenantDetails: Tenant | null = null;
  ownerDetails: Owner | null = null; // For displaying owner name

  loading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Razorpay Key - THIS IS YOUR PUBLIC KEY (rzp_test_...)
  // This should ideally be fetched from a secure backend endpoint, not hardcoded here,
  // but for immediate testing, you can place it here.
  private razorpayKeyId: string = 'rzp_test_mMYCMsqoLV36CI'; // YOUR RAZORPAY PUBLIC KEY

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private leaseService: LeaseService,
    private authService: AuthService,
    private tenantUpdateService: TenantUpdateService,
    private propertyUpdateService: PropertyUpdateService,
    private ownersService: OwnersService,
    private datePipe: DatePipe // Inject DatePipe
    //private razorpayKeyId: string = 'rzp_test_mMYCMsqoLV36CI';
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    // 1. Get parameters from route
    this.route.paramMap.pipe(
      tap(params => {
        this.propertyId = Number(params.get('propertyId'));
        this.ownerId = Number(params.get('ownerId')); // Owner ID passed from property-list
        this.rentAmount = Number(params.get('rentAmount'));
        this.period = Number(params.get('period'));
        console.log(`PaymentComponent: Route Params - PropertyId: ${this.propertyId}, OwnerId: ${this.ownerId}, RentAmount: ${this.rentAmount}, Period: ${this.period}`);

        // Basic validation for route params
        if (!this.propertyId || !this.ownerId || !this.rentAmount || !this.period || isNaN(this.propertyId) || isNaN(this.ownerId) || isNaN(this.rentAmount) || isNaN(this.period)) {
          this.error = 'Invalid property details received for payment.';
          this.loading = false;
          console.error(this.error);
          return;
        }
      }),
      // 2. Fetch logged-in tenant ID and property details
      switchMap(() => {
        const username = this.authService.getUsernameFromToken();
        if (!username || !this.authService.isTenant()) {
          this.error = 'You must be logged in as a Tenant to make a payment.';
          this.loading = false;
          return EMPTY; // Stop the observable chain
        }

        const tenantId$ = this.tenantUpdateService.getTenantIdByUsername(username).pipe(
          tap(id => this.tenantId = id),
          catchError(err => {
            console.error('Error fetching tenant ID:', err);
            this.error = 'Could not fetch tenant ID. Please login again.';
            this.loading = false;
            return EMPTY;
          })
        );

        const propertyDetails$ = this.propertyUpdateService.fetchPropertyById(this.propertyId!).pipe(
          tap(prop => this.propertyDetails = prop),
          catchError(err => {
            console.error('Error fetching property details:', err);
            this.error = 'Could not fetch property details.';
            this.loading = false;
            return EMPTY;
          })
        );

        const ownerDetails$ = this.ownersService.getOwnerById(this.ownerId!).pipe(
          tap(owner => this.ownerDetails = owner),
          catchError(err => {
            console.error('Error fetching owner details:', err);
            this.ownerDetails = { ownerId: this.ownerId, name: 'Unknown Owner', email: '', contact: '', address: '' }; // Fallback
            return of(this.ownerDetails); // Continue even if owner details fail
          })
        );

        // Fetch tenant details for name/email in Razorpay form (optional)
        const tenantDetails$ = tenantId$.pipe(
          switchMap(tId => tId ? this.tenantUpdateService.getTenantDetailsById(tId) : of(null)),
          tap(tDetails => this.tenantDetails = tDetails),
          catchError(err => {
            console.error('Error fetching tenant details:', err);
            this.tenantDetails = { tenantId: this.tenantId, name: 'Unknown Tenant', email: '', contact: '', address: '' }; // Fallback
            return of(this.tenantDetails); // Continue even if tenant details fail
          })
        );

        return forkJoin([tenantId$, propertyDetails$, ownerDetails$, tenantDetails$]);
      })
    ).subscribe({
      next: ([tenantId, propertyDetails, ownerDetails, tenantDetails]) => {
        if (tenantId && propertyDetails && this.ownerId && this.rentAmount && this.period) {
          console.log('All necessary data fetched. Ready to proceed with payment.');
          this.loading = false;
        } else {
          this.error = 'Failed to load all required data for payment.';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.message || 'An unexpected error occurred during data loading.';
        this.loading = false;
        console.error('PaymentComponent: Error in subscription:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });

    // Load Razorpay SDK Script
    this.loadRazorpayScript();
  }

  private loadRazorpayScript(): void {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay SDK loaded.');
    };
    script.onerror = (error) => {
      console.error('Failed to load Razorpay SDK:', error);
      this.error = 'Failed to load payment gateway. Please try again later.';
    };
    document.body.appendChild(script);
  }

  /**
   * Initiates the payment process by creating an order on the backend
   * and then opening the Razorpay checkout dialog.
   */
  initiatePayment(): void {
    if (this.loading || !this.propertyId || !this.ownerId || !this.tenantId || !this.rentAmount || !this.period) {
      this.error = 'Required payment details are missing or still loading.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const orderRequest: OrderCreateRequest = {
      customerName: this.tenantDetails?.name || 'Customer',
      email: this.tenantDetails?.email || 'customer@example.com',
      phoneNumber: this.tenantDetails?.contact || '9999999999',
      amount: this.rentAmount // Ensure amount is in base units (e.g., INR)
    };

    this.paymentService.createRazorpayOrder(orderRequest).subscribe({
      next: (response: OrderCreateResponse) => {
        console.log('Razorpay Order created on backend:', response);
        this.openRazorpayCheckout(response);
      },
      error: (err) => {
        this.error = `Failed to create payment order: ${err.message || 'An error occurred.'}`;
        this.loading = false;
        console.error('Error creating Razorpay order:', err);
      }
    });
  }

  /**
   * Opens the Razorpay Checkout dialog.
   * @param orderResponse Response from your backend containing Razorpay order ID.
   */
  private openRazorpayCheckout(orderResponse: OrderCreateResponse): void {
    const options = {
      key: this.razorpayKeyId, // Your public Razorpay Key ID
      amount: orderResponse.applicationFee, // Amount in paisa (backend sent it as BigInteger string, assumed to be in base unit already)
      currency: 'INR',
      name: this.propertyDetails?.propertyName || 'Property Rental',
      description: `Rent for ${this.propertyDetails?.propertyName} - ${this.period} months`,
      image: this.propertyDetails?.image || 'https://placehold.co/100x100/cccccc/333333?text=P',
      order_id: orderResponse.razorpayOrderId,
      handler: (razorpayResponse: any) => {
        // This function is called on successful payment
        console.log('Razorpay success callback:', razorpayResponse);
        this.handlePaymentSuccess(razorpayResponse);
      },
      prefill: {
        name: this.tenantDetails?.name || 'Tenant Name',
        email: this.tenantDetails?.email || 'tenant@example.com',
        contact: this.tenantDetails?.contact || '9876543210'
      },
      notes: {
        property_id: this.propertyId,
        tenant_id: this.tenantId,
        owner_id: this.ownerId,
        period: this.period,
        rent_amount: this.rentAmount
      },
      theme: {
        color: '#3399CC'
      }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      console.error('Razorpay payment failed:', response);
      this.handlePaymentFailure(response);
    });
    rzp.open();
    this.loading = false; // Checkout dialog is open, so stop loading indicator
  }

  /**
   * Handles successful payment callback from Razorpay.
   * @param razorpayResponse The response object from Razorpay.
   */
  private handlePaymentSuccess(razorpayResponse: any): void {
    this.loading = true;
    this.successMessage = null;
    this.error = null;

    // 1. Verify payment signature with your backend
    this.paymentService.verifyPayment({
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature
    }).pipe(
      // 2. If verification successful, create the lease
      switchMap(verificationResponse => {
        console.log('Payment verification successful:', verificationResponse);

        // Calculate startDate and endDate
        const today = new Date();
        const startDateFormatted = this.datePipe.transform(today, 'dd/MM/YYYY') || '';

        const endDate = new Date(today);
        // Correct calculation: period is in months. endDate is startDate + period months.
        endDate.setFullYear(endDate.getFullYear() + this.period!);
        const endDateFormatted = this.datePipe.transform(endDate, 'dd/MM/YYYY') || '';

        const leasePayload: LeaseCreatePayload = {
          propertyId: this.propertyId!,
          tenantId: this.tenantId!,
          ownerId: this.ownerId!,
          period: this.period!,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          agreementDetails: 'You should not nail it', // Default agreement details
          rentAmount: this.rentAmount!,
          leaseStatus: 'ACTIVE'
        };
        console.log('Creating lease with payload:', leasePayload);
        return this.leaseService.createLease(leasePayload);
      }),
      catchError(err => {
        console.error('Error during payment verification or lease creation:', err);
        this.error = `Payment successful, but failed to process lease: ${err.message || 'An error occurred.'}`;
        alert(this.error); // Notify user about lease failure
        return EMPTY;
      })
    ).subscribe({
      next: (leaseCreationResponse) => {
        this.successMessage = 'Payment successful and lease created!';
        console.log('Lease creation response:', leaseCreationResponse);
        alert(this.successMessage);
        this.router.navigate(['/lease-management']); // Redirect to lease management
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Handles payment failure callback from Razorpay.
   * @param razorpayResponse The response object from Razorpay indicating failure.
   */
  private handlePaymentFailure(razorpayResponse: any): void {
    this.loading = false;
    this.error = `Payment Failed: ${razorpayResponse.error.description || 'Unknown error.'}`;
    console.error('Payment failed details:', razorpayResponse);
    alert(this.error);
    // Optionally, navigate back or offer to retry
    this.router.navigate(['/property-list']);
  }

  onCancel(): void {
    this.router.navigate(['/property-list']); // Go back to property list
  }
}
