import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { OwnerUpdateProfileComponent } from './owner-update/owner-update.component';
import { OwnerHomeComponent } from './owner-home/owner-home.component';
// import { Property, PropertyComponent } from './property/property.component';

export const routes: Routes = [
    { path: "login", component: LoginComponent },
    { path: "home", component: HomeComponent },
    { path: "register", component: RegisterComponent },
    { path: "about-us", component: AboutUsComponent },
    // { path: "property", component: PropertyComponent },
    { path: 'login/:role', component: LoginComponent },
    { path: "owner-update", component: OwnerUpdateProfileComponent },
    { path: "owner-home", component: OwnerHomeComponent },
    { path: "", component: HomeComponent }
];
