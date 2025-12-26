import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShellDialogComponent } from './shell-dialog/shell-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { ShellList } from 'src/app/interface/invoice';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseService } from 'src/app/services/firebase.service';
import { LoaderService } from 'src/app/services/loader.service';
import { ViewShellComponent } from './view-shell/view-shell.component';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit {

  displayedColumns: string[] = [
    'billNo',
    'invoiceNo',
    'date',
    'customerName',
    'address',
    'customerMobileNo',
    'action',
  ];

  shellList: any[] = []
  categoryList:any []=[]

  shellDataSource = new MatTableDataSource(this.shellList);
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator = Object.create(null);


  constructor(
    private dialog: MatDialog,
    private firebaseService: FirebaseService,
    private loaderService: LoaderService,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.getShellList()
    this.getCategoryList()
  }

  applyFilter(filterValue: string): void {
    this.shellDataSource.filter = filterValue.trim().toLowerCase();
  }

  // addShell(action: string, obj: any) {
  //   obj.action = action;
  //   const dialogRef = this.dialog.open(ShellDialogComponent, { data: obj });

  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result?.event === 'Add') {
  //       const payload: ShellList = {
  //         id: '',
  //         invoiceNo: result.data.invoiceNo,
  //         billNumber: result.data.billNumber,
  //         date: result.data.date,
  //         customerName: result.data.customerName,
  //         customerAddress: result.data.customerAddress,
  //         total: result.data.total,
  //         extraDiscount: result.data.extraDiscount,
  //         mobileNumber: result.data.mobileNumber,
  //         grandTotal: result.data.grandTotal,
  //         shellDetails: result.data.shellDetails.map((detail: any) => ({
  //           productsName: detail.productsName,
  //           qty: detail.qty,
  //           productPrice: detail.productPrice,
  //           discount: detail.discount,
  //           subTotal: detail.subTotal,
  //         })),
  //         userId: localStorage.getItem("userId")
  //       };


  //       this.firebaseService.addShell(payload).then((res) => {
  //         if (res) {
  //           this.getShellList()
  //           this.openConfigSnackBar('record create successfully')
  //         }
  //       }, (error) => {

  //       })
  //     }
  //     if (result?.event === 'Edit') {
  //       this.shellList.forEach((element: any) => {
  //         if (element.id === result.data.id) {
  //           const payload: ShellList = {
  //             id: result.data.id,
  //             invoiceNo: result.data.invoiceNo,
  //             billNumber: result.data.billNumber,
  //             date: result.data.date,
  //             customerName: result.data.customerName,
  //             customerAddress: result.data.customerAddress,
  //             mobileNumber: result.data.mobileNumber,
  //             total: result.data.total,
  //             extraDiscount: result.data.extraDiscount,
  //             grandTotal: result.data.grandTotal,
  //             userId: localStorage.getItem("userId"),
  //             shellDetails: result.data.shellDetails.map((detail: any) => ({
  //               productsName: detail.productsName,
  //               qty: detail.qty,
  //               productPrice: detail.productPrice,
  //                discount: detail.discount,
  //               subTotal: detail.subTotal,
  //             })),

  //           };

  //           this.firebaseService.updateShell(result.data.id, payload).then((res: any) => {
  //             this.getShellList()
  //             this.openConfigSnackBar('record update successfully')
  //           }, (error) => {

  //           })
  //         }
  //       });
  //     }
  //     if (result?.event === 'Delete') {
  //       this.firebaseService.deleteShell(result.data.id).then((res: any) => {
  //         this.getShellList()
  //         this.openConfigSnackBar('record delete successfully')
  //       }, (error) => {

  //       })
  //     }
  //   });
  // }

  addShell(action: string, obj: any) {
    obj.action = action;
    const dialogRef = this.dialog.open(ShellDialogComponent, { data: obj });
  
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result?.event) return;
  
      const userId = localStorage.getItem("userId");
  
      // HELPER FUNCTION: Update stock in Firebase
      const updateStock = async (categoryId: string, countChange: number) => {
        const categoryItem = this.categoryList.find((cat:any) => cat.id === categoryId);
        if (categoryItem) {
          categoryItem.stockCount = (categoryItem.stockCount || 0) - countChange;
          await this.firebaseService.updateCategory(categoryItem.id, categoryItem);
        }
      };
  
      // ADD PURCHASE
      if (result.event === 'Add') {
        const payload: ShellList = {
         id: '',
          invoiceNo: result.data.invoiceNo,
          billNumber: result.data.billNumber,
          date: result.data.date,
          customerName: result.data.customerName,
          customerAddress: result.data.customerAddress,
          total: result.data.total,
          extraDiscount: result.data.extraDiscount,
          mobileNumber: result.data.mobileNumber,
          grandTotal: result.data.grandTotal,
          paymentStatus: result.data.paymentStatus,
          shellDetails: result.data.shellDetails.map((detail: any) => ({
            productsName: detail.productsName,
            qty: detail.qty,
            productPrice: detail.productPrice,
            discount: detail.discount,
            subTotal: detail.subTotal,
          })),
           paymentDetails: result.data.paymentDetails.map((detail: any) => ({
          paymentR: detail.paymentR,
          paymentReceivedDate: detail.paymentReceivedDate
        })),
          userId: localStorage.getItem("userId")
        };
  
        // Update stock in Firebase
        for (const detail of payload.shellDetails) {
          await updateStock(detail.productsName, detail.qty);
        }
  
        await this.firebaseService.addShell(payload);
        this.getShellList()
        this.openConfigSnackBar('Record created successfully');
      }
  
      // EDIT PURCHASE
      if (result.event === 'Edit') {
        const oldPurchase = this.shellList.find((el:any) => el.id === result.data.id);
        if (!oldPurchase) return;
  
        // Subtract old itemCount
        for (const oldDetail of oldPurchase.shellDetails) {
          await updateStock(oldDetail.productsName, -oldDetail.qty);
        }
  
        const payload: ShellList = {
          id: result.data.id,
              invoiceNo: result.data.invoiceNo,
              billNumber: result.data.billNumber,
              date: result.data.date,
              customerName: result.data.customerName,
              customerAddress: result.data.customerAddress,
              mobileNumber: result.data.mobileNumber,
              total: result.data.total,
              extraDiscount: result.data.extraDiscount,
              grandTotal: result.data.grandTotal,
              paymentStatus: result.data.paymentStatus,
              shellDetails: result.data.shellDetails.map((detail: any) => ({
                productsName: detail.productsName,
                qty: detail.qty,
                productPrice: detail.productPrice,
                discount: detail.discount,
                subTotal: detail.subTotal,
              })),
              paymentDetails: result.data.paymentDetails.map((detail: any) => ({
                paymentR: detail.paymentR,
                paymentReceivedDate: detail.paymentReceivedDate
              })),
              userId: localStorage.getItem("userId")

            };
        
  
        // Add new itemCount
        for (const detail of payload.shellDetails) {
          await updateStock(detail.productsName, detail.qty);
        }
  
        await this.firebaseService.updateShell(result.data.id, payload);
        this.getShellList()
        this.openConfigSnackBar('Record updated successfully');
      }
  
      // DELETE PURCHASE
      if (result.event === 'Delete') {
        const oldPurchase = this.shellList.find((el:any) => el.id === result.data.id);
        if (!oldPurchase) return;
  
        // Subtract old itemCount from stock
        for (const detail of oldPurchase.shellDetails) {
          await updateStock(detail.productsName, -detail.qty);
        }
  
        await this.firebaseService.deleteShell(result.data.id);
        this.getShellList()
        this.openConfigSnackBar('Record deleted successfully');
      }
    });
  }

  updateCategory(category: any, data: any) {
  return this.firebaseService.updateCategory(category, data);
}

  getShellList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllShell().subscribe((res: any) => {
      if (res) {
        this.shellList = res
          .filter((id: any) => id.userId === localStorage.getItem("userId"))
          .map((item: any) => ({
            ...item,
            date: this.parseDate(item.date)
          }));

      }

      this.shellDataSource = new MatTableDataSource(this.shellList);
      this.shellDataSource.paginator = this.paginator;
      this.loaderService.setLoader(false)

    })
  }

  parseDate(dateValue: any): Date {

    if (dateValue && dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }

    if (dateValue instanceof Date) {
      return dateValue;
    }

    if (typeof dateValue === 'string') {
      const cleaned = dateValue.replace(" at ", " ");
      return new Date(cleaned);
    }

    return new Date(dateValue);
  }

  openConfigSnackBar(snackbarTitle: any) {
    this._snackBar.open(snackbarTitle, 'Splash', {
      duration: 2 * 1000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  viewShellDetails(obj: any) {
      const dialogRef = this.dialog.open(ViewShellComponent, { data: obj });
 
   }

   getCategoryList() {
    this.loaderService.setLoader(true)
    this.firebaseService.getAllCategory().subscribe((res: any) => {
      if (res) {
        this.categoryList = res.filter((id: any) => id.userId === localStorage.getItem("userId"))
        this.loaderService.setLoader(false)
      }
    })
  }

}
