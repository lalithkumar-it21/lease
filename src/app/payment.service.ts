// src/app/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interface for the request body to create a Razorpay order
export interface OrderCreateRequest {
  customerName: string;
  email: string;
  phoneNumber: string;
  amount: number; // Use number as the amount will be passed from frontend
}

// Interface for the response from creating a Razorpay order
export interface OrderCreateResponse {
  razorpayOrderId: string;
  applicationFee: string; // Still a string from backend, as per your model
  pgName: string;
}

// Interface for the payload to verify payment with your backend webhook


export interface PaymentVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private paymentBackendUrl = 'http://localhost:8083/pg'; // URL of your Payment Microservice

  constructor(private http: HttpClient) { }

  /**
   * Calls the backend to create a Razorpay order.
   * @param requestPayload The order details including amount.
   * @returns An Observable of OrderCreateResponse.
   */
  createRazorpayOrder(requestPayload: OrderCreateRequest): Observable<OrderCreateResponse> {
    console.log('PaymentService: Sending request to create Razorpay order:', requestPayload);
    return this.http.post<OrderCreateResponse>(`${this.paymentBackendUrl}/createOrder`, requestPayload).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Calls the backend webhook to verify the payment signature.
   * @param verifyPayload The payment ID, order ID, and signature received from Razorpay.
   * @returns An Observable of a string response from the backend.
   */
  verifyPayment(verifyPayload: PaymentVerifyPayload): Observable<string> {
    console.log('PaymentService: Sending request to verify payment:', verifyPayload);
    // The backend /verifyPayment endpoint expects a JSON body (Map<String, Object>),
    // but the `Utils.verifyPaymentSignature` internally takes the raw JSON string.
    // For Angular's HttpClient, sending an object as payload generally results in JSON.
    // The backend will then parse this JSON into a Map and extract components.
    // We expect a text response from the backend's verify endpoint ("Payment verified and status updated.").
    return this.http.post(`${this.paymentBackendUrl}/verifyPayment`, verifyPayload, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred in PaymentService!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(`Backend returned code ${error.status}, body was:`, error.error);
      errorMessage = `Server-side error (${error.status}): ${error.statusText || 'Unknown'}`;
      if (typeof error.error === 'string') {
        errorMessage += `\nDetails: ${error.error}`;
      } else if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error) {
        errorMessage += `\nDetails: ${JSON.stringify(error.error)}`;
      }
    }
    console.error('PaymentService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
