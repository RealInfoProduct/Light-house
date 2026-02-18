import { Component, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { LoaderService } from 'src/app/services/loader.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { MatPaginator } from '@angular/material/paginator';


export interface productsData {
  id: number;
  imagePath: string;
  uname: string;
  position: string;
  productName: string;
  budget: number;
  priority: string;
}



interface month {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-top-projects',
  standalone: true,
  imports: [MaterialModule, CommonModule],
  templateUrl: './top-projects.component.html',
})
export class AppTopProjectsComponent  implements OnInit{
  shellList:any []=[]

  displayedColumns: string[] = ['billNo','customerName','date','pendingAmount'];
  dataSource = new MatTableDataSource(this.shellList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);

  constructor(  
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
  ) {
    
  }
  
  ngOnInit(): void {
      this.getShellList();
  }

getShellList() {
  this.loaderService.setLoader(true);

  this.firebaseService.getAllShell().subscribe((res: any) => {
    if (res) {

      const today = new Date();
      today.setHours(0,0,0,0); // remove time

      this.shellList = res
        .filter((item: any) => {
          if (item.userId !== localStorage.getItem("userId")) return false;
          if (Number(item.paymentDays) <= 0) return false;

          const dueDate = this.getDueDateFromInvoice(item);
          if (!dueDate) return false;

          dueDate.setHours(0,0,0,0);

          return dueDate.getTime() === today.getTime(); // 👈 Only today's due
        })
        .map((item: any) => ({
          ...item,
          pending: this.calculatePending(item),
            dueDate: this.calculateDueDate(item)  
        }));

      this.dataSource = new MatTableDataSource(this.shellList);
      this.dataSource.paginator = this.paginator;
    }

    this.loaderService.setLoader(false);
  });
}



    getBillNo(element: any): string {
      return `${element?.invoiceNo ?? ''}${(element?.invoiceNo && element?.billNumber) ? `(${element.billNumber})` : element?.billNumber ?? ''}`;
  }

calculateDueDate(item: any): string {
  if (!item?.paymentDays || !item?.date?.seconds) return '';

  const invoiceDate = new Date(item.date.seconds * 1000);

  const dueDate = new Date(invoiceDate);
  dueDate.setDate(invoiceDate.getDate() + Number(item.paymentDays));

  const day = String(dueDate.getDate()).padStart(2, '0');
  const month = String(dueDate.getMonth() + 1).padStart(2, '0');
  const year = dueDate.getFullYear();

  return `${day}/${month}/${year}`;
}


getDueDateFromInvoice(item: any): Date | null {
  if (!item?.paymentDays || !item?.date?.seconds) return null;

  const invoiceDate = new Date(item.date.seconds * 1000);
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(invoiceDate.getDate() + Number(item.paymentDays));

  return dueDate;
}


calculatePending(element: any): number {
  const grandTotal = Number(element.grandTotal) || 0;

  const totalPaid = (element.paymentDetails || []).reduce(
    (sum: number, payment: any) => sum + Number(payment.paymentR || 0),
    0
  );

  return grandTotal - totalPaid;
}


}
