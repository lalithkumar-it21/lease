import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { CommonService } from '../common.service';
import { NgForm } from '@angular/forms';
import { LoginserviceService } from '../loginservice.service';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'header',
  imports: [RouterLink,RouterOutlet,CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent  {
  token: string;
  //isLogedIn:boolean = false
  role:string
  constructor(private router:Router,private commonService:CommonService, private loginService:LoginserviceService){
   
      if(localStorage.getItem("token")){
        const token = localStorage.getItem("token");
            const decoded = jwtDecode<JwtPayload>(token);
             this.role = decoded.roles ?? 'No role found';
             console.log(this.role);

      }
          
  }
  get isLogedIn(): boolean{
    if(this.loginService.getJWT()){
      return true;
    }
    else{
      return this.loginService.logStatus();
    }
  }

  logout(){
    this.loginService.logout();
    // this.isLogedIn = false;
    alert("logged out successfully")
    this.router.navigate(["/home"])
   }

   
  // get isLogedIn(): boolean{
  //   return this.commonService.getLoginStatus();
  // }
  
}
interface JwtPayload {
  roles?: string;
  // Add other fields if needed
}
