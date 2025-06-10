import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';

import { LoginserviceService } from './loginservice.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,FormsModule, HeaderComponent,HomeComponent,RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Lease_Management';


  constructor(private logClient:LoginserviceService){
  
  }
  get isLogedIn(): boolean{
    if(this.logClient.getJWT()){
      return true;
    }
    else{
      return this.logClient.logStatus();
    }
  }
}
