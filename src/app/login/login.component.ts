import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { CommonService } from '../common.service';
import { LoginserviceService } from '../loginservice.service';
import { jwtDecode } from 'jwt-decode';



@Component({
  selector: 'login',
  imports: [RouterLink, RouterOutlet, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})




export class LoginComponent {
  constructor(private router: Router, private commonService: CommonService, private logService: LoginserviceService, private access: ActivatedRoute, private policyService: PolicyService) {

  }



  token: string;


  validated(form: NgForm): any {
    console.log("validate function calling.......");
    console.log(form.value);

    this.logService.login(form.value).subscribe({
      next: (response) => {
        localStorage.setItem("token", response);
        console.log("Login successful:", response);
        const token = response;
        const decoded = jwtDecode<JwtPayload>(token);
        const role: string = decoded.roles ?? 'No role found';
        console.log(role);
        sessionStorage.setItem("role", role);
        console.log(form.value.username);
        sessionStorage.setItem("username", form.value.username);
        if (role === 'Customer') {
          this.policyService.getCustomerByName(form.value.username).subscribe({
            next: (response) => {
              console.log("Customer response:", response);

              console.log("Customer ID:", response.customerId);
              sessionStorage.setItem("custId", response.customerId.toString());

            }
          })
          this.router.navigate(["/cust-home"]);
        }
        else {
          this.logService.getAgentByName().subscribe({
            next:(response)=>{
              console.log("Agent response:", response);
              console.log("Agent ID:", response.agentId);
              sessionStorage.setItem("agentId", response.agentId.toString());
            }
          })
          this.router.navigate(["/agent-home"]);
        }



      },
      error: (err) => {
        if (err.status === 403) {
          alert("Invalid credentials. Please try again.");
        } else {
          alert("Something went wrong. Please try later.");
        }
      }
    });
  }

  // login() {
  //   console.log(this.commonService.isLogedIn);

  // }



}

interface JwtPayload {
  roles?: string;
  // Add other fields if needed
}
