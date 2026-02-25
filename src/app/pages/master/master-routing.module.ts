import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FullComponent } from 'src/app/layouts/full/full.component';
import { FirmMasterComponent } from './firm-master/firm-master.component';
import { PartyMasterComponent } from './party-master/party-master.component';
import { CategoryMasterComponent } from './category-master/category-master.component';
import { PurchaseMasterComponent } from './purchase-master/purchase-master.component';
import { ShellComponent } from './shell/shell.component';
import { IncomeExpenseComponent } from './income-expense/income-expense.component';
import { BalanceComponent } from './balance/balance.component';
import { WarrantyMasterComponent } from './warranty-master/warranty-master.component';
import { InvoiceViewComponent } from './shell/invoice-view/invoice-view.component';



export const MasterRoutes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: 'firmmaster',
        component: FirmMasterComponent,
        data: {
          title: 'Firm Master',
          urls: [
            { title: 'Master', url: '/master/firmmaster' },
            { title: 'Firm Master' },
          ],
        },
      },
      {
        path: 'partymaster',
        component: PartyMasterComponent,
        data: {
          title: 'Party Master',
          urls: [
            { title: 'Master', url: '/master/partymaster' },
            { title: 'Party Master' },
          ],
        },
      },
      {
        path: 'purchasemaster',
        component: PurchaseMasterComponent,
        data: {
          title: 'Purchase Master',
          urls: [
            { title: 'Master', url: '/master/purchasemaster' },
            { title: 'Purchase Master' },
          ],
        },
      },
      {
        path: 'categorymaster',
        component: CategoryMasterComponent,
        data: {
          title: 'Category Master',
          urls: [
            { title: 'Master', url: '/master/categorymaster' },
            { title: 'Category Master' },
          ],
        },
      },
      {
        path: 'shellmaster',
        component: ShellComponent,
        data: {
          title: 'Shell Master',
          urls: [
            { title: 'Master', url: '/master/shellmaster' },
            { title: 'Shell Master' },
          ],
        },
      },
      {
        path: 'warrantymaster',
        component: WarrantyMasterComponent,
        data: {
          title: 'Warranty Master',
          urls: [
            { title: 'Master', url: '/master/warrantymaster' },
            { title: 'Warranty Master' },
          ],
        },
      },
      {
        path: 'income-expense',
        component: IncomeExpenseComponent,
        data: {
          title: 'Income Expense',
          urls: [
            { title: 'Master', url: '/master/income-expense' },
            { title: 'Income Expense' },
          ],
        },
      },
      {
        path: 'balance',
        component: BalanceComponent,
        data: {
          title: 'Balance',
          urls: [
            { title: 'Master', url: '/master/balance' },
            { title: 'Balance' },
          ],
        },
      },
        {
    path: '',
    component: FullComponent,
    children: [
      // ... other child routes
      { path: 'invoice/:id', component: InvoiceViewComponent },
    ],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(MasterRoutes)],
  exports: [RouterModule]
})
export class MasterRoutingModule { }
