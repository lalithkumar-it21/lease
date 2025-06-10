// import { Component, OnInit } from '@angular/core';
// import { Property, PropertyService } from '../property.service';


// @Component({
//   selector: 'property',
//   templateUrl: './property.component.html',
//   styleUrls: ['./property.component.css']
// })
// export class PropertyComponent implements OnInit {
//   properties: Property[] = [];

//   constructor(private propertyService: PropertyService) {}

//   ngOnInit(): void {
//     this.getProperties();
//   }
//   update(updatedProperty: Property): void {
//     this.propertyService.updateProperty(updatedProperty).subscribe(
//       (response) => {
//         console.log('Property updated successfully', response);
//         this.getProperties(); // Refresh the property list
//       },
//       (error) => {
//         console.error('Error updating property', error);
//       }
//     );
//   }
//   selectedProperty: Property | null = null;

//   openDetails(property: Property): void {
//     this.selectedProperty = property;
//   }
  
//   getProperties(): void {
//     this.propertyService.getAllProperties().subscribe(
//       (data) => {
//         this.properties = data;
//       },
//       (error) => {
//         console.error('Error fetching properties', error);
//       }
//     );
//   }
// }
// export type { Property };

