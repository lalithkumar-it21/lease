import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonService } from '../common.service'; // Assuming this exists
import { RegisterserviceService } from '../registerservice.service';

@Component({
  selector: 'register',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  myForm: FormGroup;
  custRole: boolean;
  passwordStrength: string = '';
  constructor(private router: Router, private fb: FormBuilder, private commonService: CommonService, private regService: RegisterserviceService) {

  }
  ngOnInit(): void {
    this.myForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(25)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.passwordValidator.bind(this)]],
      confirmPassword: ['', [Validators.required]],
      roles: ['', [Validators.required]],
      contact: ['', [Validators.required]],
      address: ['', [Validators.required]],

    }, { validator: this.passwordMatchValidator })

    // Add conditional validators for contact and address based on roles
    this.myForm.get('roles')?.valueChanges.subscribe(role => {
      const contactControl = this.myForm.get('contact');
      const addressControl = this.myForm.get('address');

      if (role === 'tenant' || role === 'owner') {
        contactControl?.setValidators([Validators.required, Validators.pattern('^[6789]\\d{9}$')]); // Example: 10-digit phone number
        addressControl?.setValidators([Validators.required, Validators.minLength(5)]);
      } else {
        contactControl?.clearValidators();
        addressControl?.clearValidators();
      }
      contactControl?.updateValueAndValidity();
      addressControl?.updateValueAndValidity();
    });
  }

  
  passwordValidator(control): { [key: string]: any } | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[@$!%*?&]/.test(value);
    const isValidLength = value.length >= 8;

    const valid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && isValidLength;

    this.updatePasswordStrength(value); // Ensure this runs

    return valid ? null : { weakPassword: true };
}


updatePasswordStrength(password: string): void {
  const strengthLevels = ['Strong' ,'Weak','Medium'];
  const score = [/[A-Z]/, /[a-z]/, /\d/, /[@$!%*?&]/].filter(regex => regex.test(password)).length;

  this.passwordStrength = strengthLevels[Math.min(score, strengthLevels.length - 1)];
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
      alert('Tenant registration successful!'); // User feedback
      this.router.navigate(["/login"]);
    },
      error => {
        console.error("Tenant registration failed:", error);
        alert('Tenant registration failed. Please try again.'); // User feedback
      });
  }

  submitRegisterUser(form): void {
    console.log("inside submit Admin", form.value);

    this.regService.registerUser(form.value).subscribe(response => {
      console.log(response);
      alert('Admin registration successful!'); // User feedback
      this.router.navigate(["/login"]);
    },
      error => {
        console.error("Admin registration failed:", error);
        alert('Admin registration failed. Please try again.'); // User feedback
      });
  }
  
  submitOwner(form): void {
    console.log("inside submit Agent", form.value);

    this.regService.registerBoth2(form.value).subscribe(response => {
      console.log(response);
      alert('Owner registration successful!'); // User feedback
      this.router.navigate(["/login"]);
    },
      error => {
        console.error("Owner registration failed:", error);
        alert('Owner registration failed. Please try again.'); // User feedback
      });
  }
}