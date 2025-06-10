import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonService } from '../common.service'; // Assuming this exists
import { RegisterserviceService } from '../registerservice.service';

@Component({
  selector: 'new-user',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './new-user.component.html',
  styleUrl: './new-user.component.css'
})
export class NewUserComponent implements OnInit {
  myForm: FormGroup;
  custRole: boolean;
  constructor(private router: Router, private fb: FormBuilder, private commonService: CommonService, private regService: RegisterserviceService) {

  }
  ngOnInit(): void {
    this.myForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(15)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
      roles: ['', [Validators.required]],
      contact: [''],
      address: [''],

    }, { validator: this.passwordMatchValidator })

    // Add conditional validators for contact and address based on roles
    this.myForm.get('roles')?.valueChanges.subscribe(role => {
      const contactControl = this.myForm.get('contact');
      const addressControl = this.myForm.get('address');

      if (role === 'Tenant' || role === 'Owner') {
        contactControl?.setValidators([Validators.required, Validators.pattern(/^\d{10}$/)]); // Example: 10-digit phone number
        addressControl?.setValidators(Validators.required);
      } else {
        contactControl?.clearValidators();
        addressControl?.clearValidators();
      }
      contactControl?.updateValueAndValidity();
      addressControl?.updateValueAndValidity();
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get("password")?.value;
    const conPassword = form.get("confirmPassword")?.value;
    return password === conPassword ? null : { mismatch: true }
  }
  onReset(): void {
    this.myForm.reset();
  }
  submit(form): void {
    if (this.myForm.valid) {
      const role = this.myForm.get('roles')?.value;
      console.log(role)
      if (role == "tenant") {
        this.submitTenant(form);
      }
      else if(role == "admin") {
        this.submitRegisterUser(form);
      }

      else {
        this.submitOwner(form);
      }

      // this.commonService.onSubmit(form)
    }
  }
  submitTenant(form): void {
    console.log("inside submit customer", form.value);

    this.regService.registerBoth1(form.value).subscribe(response => {
      console.log(response);
      alert('Tenant creation successful!'); // User feedback
      this.router.navigate(["/admin-home"]);
    },
      error => {
        console.error("Tenant creation failed:", error);
        alert('Tenant registration failed. Please try again.'); // User feedback
      });
  }

  submitRegisterUser(form): void {
    console.log("inside submit Admin", form.value);

    this.regService.registerUser(form.value).subscribe(response => {
      console.log(response);
      alert('Admin creation successful!'); // User feedback
      this.router.navigate(["/admin-home"]);
    },
      error => {
        console.error("Admin creation failed:", error);
        alert('Admin creation failed. Please try again.'); // User feedback
      });
  }
  
  submitOwner(form): void {
    console.log("inside submit Agent", form.value);

    this.regService.registerBoth2(form.value).subscribe(response => {
      console.log(response);
      alert('Owner creation successful!'); // User feedback
      this.router.navigate(["/admin-home"]);
    },
      error => {
        console.error("Owner creation failed:", error);
        alert('Owner creation failed. Please try again.'); // User feedback
      });
  }
}