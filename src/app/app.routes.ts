import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { AboutUsComponent } from './about-us/about-us.component';

import { OwnerDashboardComponent } from './owner-home/owner-home.component';



import { OwnerUpdateComponent } from './owner-update/owner-update.component';
import { TenantHomeComponent } from './tenant-home/tenant-home.component';
import { PropertyListComponent } from './property-list/property-list.component';
import { TenantUpdateComponent } from './tenant-update/tenant-update.component';
import { OwnerPropertyComponent } from './owner-property-management/owner-property-management.component';
import { PropertyCreateComponent } from './property-create/property-create.component';
import { PropertyUpdateComponent } from './property-update/property-update.component';
import { PropertyRequestComponent } from './property-request/property-request.component';
import { AdminHomeComponent } from './admin-home/admin-home.component';
import { OwnerComponent } from './owner/owner.component';
import { OwnerCreateComponent } from './owner-create/owner-create.component';
import { OwnerUpdatedComponent } from './admin-owner-update/admin-owner-update.component';
import { NewUserComponent } from './new-user/new-user.component';
import { AdminPropertyListComponent } from './admin-property/admin-property.component';
import { LeaseManagementComponent } from './lease-management/lease-management.component';
import { LeaseCreateComponent } from './lease-create/lease-create.component';
import { LeaseUpdateComponent } from './lease-update/lease-update.component';
import { AdminPropertyCreateComponent } from './admin-property-create/admin-property-create.component';
import { PaymentComponent } from './payment/payment.component';
import { AdminTenantComponent } from './admin-tenant/admin-tenant.component';
import { authGuard } from './auth.guard';



// import { Property, PropertyComponent } from './property/property.component';

export const routes: Routes = [
    { path: "login", component: LoginComponent },
    { path: "home", component: HomeComponent },
    { path: "register", component: RegisterComponent },
    { path: "about-us", component: AboutUsComponent },
    // { path: "property", component: PropertyComponent },
    
    { path: 'owners', component: OwnerComponent,canActivate:[authGuard] }, // Route to display all owners
    { path: 'owner-create', component: OwnerCreateComponent,canActivate:[authGuard] }, // Route for creating new owner
    { path: 'admin-owner-update/:ownerId', component: OwnerUpdatedComponent ,canActivate:[authGuard]},
    { path: 'new-user', component:  NewUserComponent,canActivate:[authGuard]},
    { path: 'admin/owners', component: OwnerComponent ,canActivate:[authGuard]},
    { path: "admin-home", component: AdminHomeComponent,canActivate:[authGuard] },
    { path: 'login/:role', component: LoginComponent },
    { path: "owner-update", component: OwnerUpdateComponent ,canActivate:[authGuard]},
    { path: "owner-home", component: OwnerDashboardComponent ,canActivate:[authGuard]},
    { path: "tenant-home", component: TenantHomeComponent ,canActivate:[authGuard]},
    { path: 'property-list', component: PropertyListComponent ,canActivate:[authGuard]}, 
    { path: 'admin/tenant', component: AdminTenantComponent ,canActivate:[authGuard]},
 
    { path: 'lease-management', component: LeaseManagementComponent ,canActivate:[authGuard]},
    { path: 'lease-create', component: LeaseCreateComponent ,canActivate:[authGuard]}, // Admin only access is controlled in component
    { path: 'lease-update/:id', component: LeaseUpdateComponent ,canActivate:[authGuard]}, 
    { path: 'admin/property-create/:ownerId', component: AdminPropertyCreateComponent ,canActivate:[authGuard]},
    { path: 'payment/:propertyId/:rentAmount/:period/:ownerId', component: PaymentComponent ,canActivate:[authGuard]},

    { path: 'tenant-update', component: TenantUpdateComponent ,canActivate:[authGuard]},
    { path: 'owner-property', component: OwnerPropertyComponent,canActivate:[authGuard] },
    { path: 'property-update/:propertyId', component: PropertyUpdateComponent,canActivate:[authGuard] },
    { path: 'property-request', component: PropertyRequestComponent,canActivate:[authGuard] },
    { path: 'property-create', component: PropertyCreateComponent ,canActivate:[authGuard]},
    { path: 'admin-property', component: AdminPropertyListComponent ,canActivate:[authGuard]},

    { path: "", component: HomeComponent }
];
