import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

  export class HomeComponent {
    // Helper to get the current year for the footer
    getCurrentYear(): number {
      return new Date().getFullYear();
    }
}
