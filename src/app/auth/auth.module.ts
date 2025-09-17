import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ForgotPasswordModalComponent } from './components/cambiopass/forgot-password-modal/forgot-password-modal.component';




@NgModule({
  declarations: [
    LoginComponent,
    RegistroComponent,
    ForgotPasswordModalComponent

  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,
    
  ]
})
export class AuthModule { }
