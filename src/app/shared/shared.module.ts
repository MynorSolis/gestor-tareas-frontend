import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { TruncatePipe } from './pipes/truncate.pipe';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModalModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PaginationComponent } from './pagination/pagination.component';
import { FileSizePipe } from './pipes/file-size.pipe';



@NgModule({
  declarations: [
    NavbarComponent,
    SidebarComponent,
    TruncatePipe,
    PaginationComponent,
    FileSizePipe
   
  ],
  imports: [
    CommonModule,
    FeatherModule.pick(allIcons),
    RouterModule,
    CommonModule, 
    FormsModule,
    NgbModule,
    ReactiveFormsModule, 
    NgbDropdownModule,
    NgbModalModule
    
  ],
  exports: [
    NavbarComponent,
    SidebarComponent,
    FeatherModule,
    TruncatePipe,
    PaginationComponent,
    FileSizePipe
  ]
})
export class SharedModule { }
