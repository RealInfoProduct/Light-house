import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FullComponent } from 'src/app/layouts/full/full.component';
import { FirmMasterComponent } from './firm-master/firm-master.component';
import { PartyMasterComponent } from './party-master/party-master.component';
import { CategoryMasterComponent } from './category-master/category-master.component';
import { PurchaseMasterComponent } from './purchase-master/purchase-master.component';
import { ShellComponent } from './shell/shell.component';



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
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(MasterRoutes)],
  exports: [RouterModule]
})
export class MasterRoutingModule { }
