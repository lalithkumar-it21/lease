import { CanActivateFn } from '@angular/router';
import { CommonService } from './common.service';
import { inject } from '@angular/core';
 
export const authGuard: CanActivateFn = (route, state) => {
  if(sessionStorage.getItem("role")==="admin" || sessionStorage.getItem("role")==="tenant"|| sessionStorage.getItem("role")==="owner" ){
    console.log("Access granted");
    return true;
  } else{
    console.log("Access not granted. Login to get Access");
    return false;
  }
};