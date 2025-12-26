import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { MasterRoutes, MasterRoutingModule } from './master-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MaterialModule } from 'src/app/material.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpLoaderFactory } from 'src/app/app.module';
import { HttpClient } from '@angular/common/http';

import { NgxMatNativeDateModule, NgxMatDatetimePickerModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';
import { FirmMasterComponent, firmMasterDialogComponent } from './firm-master/firm-master.component';
import { PartyMasterComponent, partyMasterDialogComponent } from './party-master/party-master.component';
import { CategoryMasterComponent } from './category-master/category-master.component';
import { CategoryMasterDialogComponent } from './category-master/category-master-dialog/category-master-dialog.component';
import { PurchaseMasterComponent } from './purchase-master/purchase-master.component';
import { PurchaseMasterDialogComponent } from './purchase-master/purchase-master-dialog/purchase-master-dialog.component';
import { ShellComponent } from './shell/shell.component';
import { ShellDialogComponent } from './shell/shell-dialog/shell-dialog.component';
import { ViewcompanyComponent } from './purchase-master/viewcompany/viewcompany.component';
import { ViewShellComponent } from './shell/view-shell/view-shell.component';
import { PaymentDetailsComponent } from './purchase-master/payment-details/payment-details.component';

@NgModule({
  declarations: [
    FirmMasterComponent,
    firmMasterDialogComponent,
    PartyMasterComponent,
    partyMasterDialogComponent,
    CategoryMasterComponent,
    CategoryMasterDialogComponent,
    PurchaseMasterComponent,
    PurchaseMasterDialogComponent,
    ShellComponent,
    ShellDialogComponent,
    ViewcompanyComponent,
    ViewShellComponent,
    PaymentDetailsComponent
  ],
  imports: [
    CommonModule,
    MasterRoutingModule,
    RouterModule.forChild(MasterRoutes),
    MaterialModule,
    FormsModule,
    MaterialModule,
    ReactiveFormsModule,
    TablerIconsModule,
    MatNativeDateModule,
    NgApexchartsModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
     NgxMatNativeDateModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [DatePipe],
})
export class MasterModule { }
