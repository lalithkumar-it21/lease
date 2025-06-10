import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  
  constructor(private router:Router) { 

  }
  public isLogedIn = false;
  validate(form):boolean{
    console.log("logged In",form.value.userName);
    console.log("logged In",form.value.password);
    var un:string=localStorage.getItem("username")
    var pwd:string=localStorage.getItem("password")
    console.log(un)
    console.log(form.value.userName)
    console.log(pwd)
    console.log(form.value.password)
    
    if(form.value.userName == un && form.value.password == pwd){
      this.isLogedIn=true;
      this.router.navigate(["/insurance"])
      return this.isLogedIn
      
    }
  }
  getLoginStatus():boolean{
    return this.isLogedIn;
  }
  onSubmit(form) : void{
      localStorage.setItem("username",form.get("name").value);
      localStorage.setItem("password",form.get("password").value);
      // this.isLogedIn=true; 
      this.router.navigate(["/login"]);
    }
    logout():boolean{
    
      alert("logout successful")
      this.router.navigate(["/login"])
      localStorage.clear()
      this.isLogedIn=false;
      return this.isLogedIn
    }
    
  }



