import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonService } from '../common.service';
import { RegisterserviceService } from '../registerservice.service';

@Component({
  selector: 'register',
  imports: [RouterLink,ReactiveFormsModule,CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  myForm:FormGroup;
  custRole:boolean;
  constructor(private router:Router,private fb:FormBuilder,private commonService:CommonService,private regService:RegisterserviceService){

  }
  ngOnInit(): void {
    this.myForm = this.fb.group({
      name:['',[Validators.required,Validators.minLength(4),Validators.maxLength(15)]],
      email:['',[Validators.required,Validators.email]],
      password:['',[Validators.required]],
      confirmPassword:['',[Validators.required]],
      roles:['',[Validators.required]],
      contact:[''],
      address:[''],
     
    },{validator:this.passwordMatchValidator})
  }

  passwordMatchValidator(form : FormGroup){
    const password = form.get("password").value;
    const conPassword = form.get("confirmPassword").value;
    return password === conPassword ? null :{mismatch:true}
  }
  onReset() :void{
    this.myForm.reset();
  }
  submit(form) : void{
    if(this.myForm.valid){
      const role = this.myForm.get('roles') ?.value;
      console.log(role)
      if(role == "Tenant"){
          this.submitTenant(form);
      }
      else{
        this.submitOwner(form);
      }
      
      // this.commonService.onSubmit(form)
    }
  }
  submitTenant(form):void{
    console.log("inside submit customer", form.value);
   
    this.regService.registerBoth1(form.value).subscribe(response => {console.log(response)})
    
    const role=form.value.roles
    console.log(role)
    this.router.navigate(["/login"]);
  }
  submitOwner(form):void{
    console.log("inside submit Agent", form.value);
   
    this.regService.registerBoth2(form.value).subscribe(response => {console.log(response)})
    
    const role=form.value.roles
    console.log(role)
    this.router.navigate(["/login"]);
  }
}
